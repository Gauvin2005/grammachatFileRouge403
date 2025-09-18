# Déploiement

## Production Simple

### Docker Compose Production

```yaml
# docker-compose.prod.yml
services:
  api:
    image: grammachat-backend:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongodb:27017/grammachat
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mongodb
    networks:
      - grammachat-network

  mongodb:
    image: mongo:7.0
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db
    networks:
      - grammachat-network

volumes:
  mongodb_data:

networks:
  grammachat-network:
    driver: bridge
```

### Déploiement

```bash
# 1. Construire l'image
docker build -t grammachat-backend:latest ./backend

# 2. Configuration production
cat > .env.prod << EOF
JWT_SECRET=your-super-secret-jwt-key-for-production
EOF

# 3. Déployer
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 4. Vérifier
curl http://localhost:3000/api/health
```

## Cloud (AWS/GCP/Azure)

### Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grammachat-api
spec:
  replicas: 2
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
        image: grammachat-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: grammachat-secrets
              key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: grammachat-api-service
spec:
  selector:
    app: grammachat-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Déploiement K8s

```bash
# Appliquer
kubectl apply -f k8s/

# Vérifier
kubectl get pods
kubectl get services
```

## Configuration Production

### Variables essentielles

```bash
NODE_ENV=production
JWT_SECRET=<super-secure-secret-key>
MONGODB_URI=mongodb://mongodb:27017/grammachat
LANGUAGETOOL_API_URL=https://api.languagetool.org/v2/check
```

### SSL/HTTPS

```bash
# Let's Encrypt
certbot certonly --standalone -d yourdomain.com

# Nginx SSL
server {
    listen 443 ssl;
    server_name yourdomain.com;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location /api/ {
        proxy_pass http://localhost:3000;
    }
}
```

## Monitoring

### Health Checks

```bash
# API
curl https://yourdomain.com/api/health

# Logs
docker logs grammachat-api
kubectl logs deployment/grammachat-api
```

### Sauvegardes

```bash
# MongoDB
mongodump --uri="mongodb://localhost:27017/grammachat" --out=./backup/

# Docker volumes
docker run --rm -v grammachat_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz /data
```
