"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorStateProps {
  error: string
  onRetry?: () => void
  title?: string
  description?: string
}

export function ErrorState({ error, onRetry, title = "خطأ في تحميل البيانات", description }: ErrorStateProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-lg text-destructive">{title}</CardTitle>
        {description && (
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md font-mono">
          {error}
        </p>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            variant="outline" 
            className="gap-2"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export function EmptyState({ 
  title = "لا توجد بيانات متاحة", 
  description = "لا توجد بيانات لعرضها في الوقت الحالي",
  icon 
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          {icon || <AlertCircle className="h-6 w-6 text-muted-foreground" />}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}