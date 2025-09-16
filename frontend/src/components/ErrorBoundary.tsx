import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../utils/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Mettre à jour l'état pour afficher l'UI d'erreur
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log l'erreur pour le debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Card style={styles.errorCard}>
            <Card.Content style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="warning" size={64} color={colors.error} />
              </View>
              
              <Text style={styles.title}>Oups ! Une erreur s'est produite</Text>
              
              <Text style={styles.message}>
                L'application a rencontré une erreur inattendue. 
                Cela peut être dû à un problème de rendu ou de données.
              </Text>

              {__DEV__ && this.state.error && (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugTitle}>Détails de l'erreur (dev):</Text>
                  <Text style={styles.debugText}>
                    {this.state.error.message}
                  </Text>
                  {this.state.errorInfo && (
                    <Text style={styles.debugText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </View>
              )}

              <Button
                mode="contained"
                onPress={this.handleReload}
                style={styles.reloadButton}
                buttonColor={colors.primary}
                textColor={colors.surface}
                icon="refresh"
              >
                Recharger l'application
              </Button>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorCard: {
    width: '100%',
    maxWidth: 400,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  debugContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    width: '100%',
  },
  debugTitle: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: spacing.sm,
  },
  debugText: {
    ...typography.small,
    color: colors.text,
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
  },
  reloadButton: {
    marginTop: spacing.md,
  },
});

export default ErrorBoundary;
