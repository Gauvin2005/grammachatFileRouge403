# Guide de Déploiement - Grammachat

## 🚀 Vue d'ensemble

Ce guide couvre le déploiement de Grammachat en environnement de développement, staging et production. L'application utilise Docker pour la containerisation et peut être déployée sur diverses plateformes cloud.

## 📋 Prérequis

### Outils requis
- **Docker** : Version 20.10+
- **Docker Compose** : Version 2.0+
- **kubectl** : Pour Kubernetes (optionnel)
- **Terraform** : Pour Infrastructure as Code (optionnel)
- **Helm** : Pour Kubernetes (optionnel)

### Comptes requis
- **Docker Hub** ou **GitHub Container Registry**
- **Cloud Provider** : AWS, GCP, Azure
- **Domain Name** : Pour la production
- **SSL Certificate** : Let's Encrypt ou commercial

## 🏗️ Architecture de Déploiement

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Internet  │    │   CDN       │    │   Load      │     │
│  │             │    │   (CloudFlare│    │   Balancer  │     │
│  │             │    │    /AWS)     │    │   (Nginx)   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │           │
│         └───────────────────┼───────────────────┘           │
│                             │                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Application Layer                       │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │   API       │  │   API       │  │   API       │    │ │
│  │  │ Instance 1  │  │ Instance 2  │  │ Instance N  │    │ │
│  │  │ (Docker)    │  │ (Docker)    │  │ (Docker)    │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Data Layer                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │   MongoDB   │  │    Redis    │  │   Storage   │    │ │
│  │  │  Cluster    │  │   Cluster   │  │   (S3/GCS)  │    │ │
│  │  │             │  │             │  │             │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🐳 Déploiement avec Docker

### 1. Préparation des images

#### Backend
```bash
# Construire l'image backend
cd backend
docker build -t grammachat-backend:latest .

# Tag pour le registry
docker tag grammachat-backend:latest your-registry/grammachat-backend:latest

# Push vers le registry
docker push your-registry/grammachat-backend:latest
```

#### Frontend
```bash
# Construire l'image frontend
cd frontend
docker build -t grammachat-frontend:latest .

# Tag pour le registry
docker tag grammachat-frontend:latest your-registry/grammachat-frontend:latest

# Push vers le registry
docker push your-registry/grammachat-frontend:latest
```

### 2. Configuration Docker Compose

#### Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    image: your-registry/grammachat-backend:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongodb:27017/grammachat
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      LANGUAGETOOL_API_KEY: ${LANGUAGETOOL_API_KEY}
    depends_on:
      - mongodb
      - redis
    networks:
      - grammachat-network

  mongodb:
    image: mongo:7.0
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - grammachat-network

  redis:
    image: redis:7.2-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - grammachat-network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    networks:
      - grammachat-network

volumes:
  mongodb_data:
  redis_data:

networks:
  grammachat-network:
    driver: bridge
```

### 3. Configuration Nginx

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3000;
    }

    server {
        listen 80;
        server_name grammachat.com www.grammachat.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name grammachat.com www.grammachat.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location /api/ {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### 4. Déploiement

```bash
# Créer le fichier .env.prod
cat > .env.prod << EOF
JWT_SECRET=your-super-secret-jwt-key-for-production
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-mongodb-password
LANGUAGETOOL_API_KEY=your-languagetool-api-key
EOF

# Déployer
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Vérifier le statut
docker-compose -f docker-compose.prod.yml ps
```

## ☁️ Déploiement Cloud

### AWS (Amazon Web Services)

#### 1. Infrastructure avec Terraform

```hcl
# main.tf
provider "aws" {
  region = "us-west-2"
}

# VPC
resource "aws_vpc" "grammachat" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "grammachat-vpc"
  }
}

# Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.grammachat.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "grammachat-public-${count.index + 1}"
  }
}

# Security Groups
resource "aws_security_group" "api" {
  name_prefix = "grammachat-api-"
  vpc_id      = aws_vpc.grammachat.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "grammachat" {
  name = "grammachat"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "grammachat-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name  = "api"
      image = "your-registry/grammachat-backend:latest"
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "MONGODB_URI"
          value = aws_docdb_cluster.grammachat.endpoint
        }
      ]
      secrets = [
        {
          name      = "JWT_SECRET"
          valueFrom = aws_secretsmanager_secret.jwt_secret.arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.api.name
          awslogs-region        = "us-west-2"
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# Application Load Balancer
resource "aws_lb" "grammachat" {
  name               = "grammachat-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
}

# DocumentDB (MongoDB compatible)
resource "aws_docdb_cluster" "grammachat" {
  cluster_identifier      = "grammachat"
  engine                  = "docdb"
  master_username         = "grammachat"
  master_password         = var.docdb_password
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  skip_final_snapshot     = true
  db_subnet_group_name    = aws_docdb_subnet_group.grammachat.name
  vpc_security_group_ids  = [aws_security_group.docdb.id]
}
```

#### 2. Déploiement avec AWS CLI

```bash
# Configurer AWS CLI
aws configure

# Créer l'infrastructure
terraform init
terraform plan
terraform apply

# Déployer l'application
aws ecs update-service \
  --cluster grammachat \
  --service grammachat-api \
  --force-new-deployment
```

### Google Cloud Platform (GCP)

#### 1. Kubernetes avec GKE

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: grammachat

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grammachat-config
  namespace: grammachat
data:
  NODE_ENV: "production"
  MONGODB_URI: "mongodb://mongodb-service:27017/grammachat"
  REDIS_URL: "redis://redis-service:6379"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: grammachat-secrets
  namespace: grammachat
type: Opaque
data:
  JWT_SECRET: <base64-encoded-secret>
  LANGUAGETOOL_API_KEY: <base64-encoded-key>

---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grammachat-api
  namespace: grammachat
spec:
  replicas: 3
  selector:
    matchLabels:
      app: grammachat-api
  template:
    metadata:
      labels:
        app: grammachat-api
    spec:
      containers:
      - name: api
        image: gcr.io/your-project/grammachat-backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: grammachat-config
        - secretRef:
            name: grammachat-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: grammachat-api-service
  namespace: grammachat
spec:
  selector:
    app: grammachat-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grammachat-ingress
  namespace: grammachat
  annotations:
    kubernetes.io/ingress.global-static-ip-name: "grammachat-ip"
    networking.gke.io/managed-certificates: "grammachat-ssl-cert"
spec:
  rules:
  - host: api.grammachat.com
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: grammachat-api-service
            port:
              number: 80
```

#### 2. Déploiement avec kubectl

```bash
# Configurer kubectl
gcloud container clusters get-credentials grammachat-cluster --zone us-central1-a

# Appliquer les configurations
kubectl apply -f k8s/

# Vérifier le déploiement
kubectl get pods -n grammachat
kubectl get services -n grammachat
kubectl get ingress -n grammachat
```

### Azure

#### 1. Container Instances

```bash
# Créer un groupe de ressources
az group create --name grammachat-rg --location eastus

# Créer un container registry
az acr create --resource-group grammachat-rg --name grammachatacr --sku Basic

# Construire et pousser l'image
az acr build --registry grammachatacr --image grammachat-backend:latest ./backend

# Déployer avec Container Instances
az container create \
  --resource-group grammachat-rg \
  --name grammachat-api \
  --image grammachatacr.azurecr.io/grammachat-backend:latest \
  --cpu 1 \
  --memory 1 \
  --registry-login-server grammachatacr.azurecr.io \
  --registry-username grammachatacr \
  --registry-password <password> \
  --dns-name-label grammachat-api \
  --ports 3000 \
  --environment-variables NODE_ENV=production
```

## 🔧 Configuration de Production

### 1. Variables d'environnement

```bash
# .env.production
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongodb-cluster:27017/grammachat
REDIS_URL=redis://redis-cluster:6379
JWT_SECRET=<super-secure-secret-key>
JWT_EXPIRES_IN=7d
LANGUAGETOOL_API_URL=https://api.languagetool.org/v2/check
LANGUAGETOOL_API_KEY=<your-api-key>
XP_PER_CHARACTER=1
XP_BONUS_NO_ERRORS=10
XP_PENALTY_PER_ERROR=5
LEVEL_UP_THRESHOLD=100
CORS_ORIGIN=https://grammachat.com,https://app.grammachat.com
LOG_LEVEL=info
```

### 2. Sécurité

#### SSL/TLS
```bash
# Générer un certificat Let's Encrypt
certbot certonly --standalone -d grammachat.com -d www.grammachat.com

# Ou utiliser un certificat commercial
# Télécharger et installer le certificat dans /etc/nginx/ssl/
```

#### Firewall
```bash
# UFW (Ubuntu)
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable

# iptables
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -j DROP
```

### 3. Monitoring

#### Prometheus + Grafana
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'grammachat-api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 5s
```

#### Logs centralisés
```yaml
# logging/fluentd.conf
<source>
  @type forward
  port 24224
</source>

<match **>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name grammachat
</match>
```

## 🚀 Déploiement Automatisé

### 1. Pipeline CI/CD

#### GitLab CI
```yaml
# .gitlab-ci.yml (voir le fichier principal)
deploy_production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - echo "🚀 Deploying to production"
    - curl -X POST "$PROD_DEPLOY_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d '{"ref":"'$CI_COMMIT_SHA'","environment":"production"}'
  environment:
    name: production
    url: https://grammachat.com
  when: manual
  only:
    - main
```

#### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          echo "🚀 Deploying to production"
          # Script de déploiement personnalisé
          ./scripts/deploy.sh production
```

### 2. Scripts de déploiement

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=$1
VERSION=${CI_COMMIT_SHA:-$(git rev-parse HEAD)}

echo "🚀 Deploying Grammachat to $ENVIRONMENT"
echo "📦 Version: $VERSION"

# Build images
docker build -t grammachat-backend:$VERSION ./backend
docker build -t grammachat-frontend:$VERSION ./frontend

# Tag for registry
docker tag grammachat-backend:$VERSION $REGISTRY/grammachat-backend:$VERSION
docker tag grammachat-frontend:$VERSION $REGISTRY/grammachat-frontend:$VERSION

# Push to registry
docker push $REGISTRY/grammachat-backend:$VERSION
docker push $REGISTRY/grammachat-frontend:$VERSION

# Deploy to environment
case $ENVIRONMENT in
  "development")
    kubectl set image deployment/grammachat-api api=$REGISTRY/grammachat-backend:$VERSION -n grammachat-dev
    ;;
  "staging")
    kubectl set image deployment/grammachat-api api=$REGISTRY/grammachat-backend:$VERSION -n grammachat-staging
    ;;
  "production")
    kubectl set image deployment/grammachat-api api=$REGISTRY/grammachat-backend:$VERSION -n grammachat-prod
    ;;
esac

echo "✅ Deployment completed successfully"
```

## 🔍 Vérification du Déploiement

### 1. Health Checks

```bash
# Vérifier l'API
curl https://api.grammachat.com/api/health

# Vérifier la base de données
curl https://api.grammachat.com/api/health/database

# Vérifier Redis
curl https://api.grammachat.com/api/health/redis
```

### 2. Tests de charge

```bash
# Utiliser Artillery
artillery run load-test.yml

# Utiliser k6
k6 run load-test.js
```

### 3. Monitoring

```bash
# Vérifier les logs
kubectl logs -f deployment/grammachat-api -n grammachat-prod

# Vérifier les métriques
curl https://api.grammachat.com/api/metrics

# Vérifier le statut des pods
kubectl get pods -n grammachat-prod
```

## 🛠️ Maintenance

### 1. Mises à jour

```bash
# Mise à jour des images
docker pull $REGISTRY/grammachat-backend:latest
docker-compose up -d --no-deps api

# Mise à jour des dépendances
npm audit fix
npm update
```

### 2. Sauvegardes

```bash
# Sauvegarde MongoDB
mongodump --uri="mongodb://localhost:27017/grammachat" --out=./backup/$(date +%Y%m%d)

# Sauvegarde Redis
redis-cli --rdb ./backup/redis-$(date +%Y%m%d).rdb
```

### 3. Rollback

```bash
# Rollback Kubernetes
kubectl rollout undo deployment/grammachat-api -n grammachat-prod

# Rollback Docker Compose
docker-compose down
docker-compose up -d --scale api=0
docker-compose up -d --scale api=3
```

## 📊 Métriques et Alertes

### 1. Métriques importantes
- **Uptime** : Disponibilité de l'API
- **Response Time** : Temps de réponse moyen
- **Error Rate** : Taux d'erreur 4xx/5xx
- **Throughput** : Requêtes par seconde
- **Resource Usage** : CPU, RAM, Disque

### 2. Alertes
- **Uptime < 99%** : Service indisponible
- **Response Time > 2s** : Performance dégradée
- **Error Rate > 5%** : Trop d'erreurs
- **CPU > 80%** : Ressources insuffisantes
- **Memory > 90%** : Mémoire saturée

Ce guide de déploiement garantit une mise en production robuste et scalable de Grammachat, avec des procédures de maintenance et de monitoring appropriées.
