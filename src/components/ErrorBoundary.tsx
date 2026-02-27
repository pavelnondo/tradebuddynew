
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Error logging can be sent to error tracking service in production
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader className="bg-destructive/10">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl font-bold mb-2">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground mb-6">
                An unexpected error occurred. Don't worry, your data is safe.
              </p>
              {this.state.error && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm">Error Details:</h3>
                  <pre className="text-xs text-muted-foreground overflow-auto max-h-32">
                    {this.state.error.toString()}
                  </pre>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={this.handleReset}
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
