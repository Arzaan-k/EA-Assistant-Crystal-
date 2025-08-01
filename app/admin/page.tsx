import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { DeploymentStatus } from "@/components/deployment-status"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Server, Database, Zap, Shield } from "lucide-react"

export default function AdminPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">System Administration</h1>
        </div>
      </header>
      <div className="flex-1 p-4 pt-0 space-y-6">
        {/* Deployment Status */}
        <DeploymentStatus />

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Server Status</CardTitle>
              <Server className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Online</div>
              <p className="text-xs text-muted-foreground">
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Connected</div>
              <p className="text-xs text-muted-foreground">
                <Badge className="bg-blue-100 text-blue-800">Neon PostgreSQL</Badge>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Services</CardTitle>
              <Zap className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">
                <Badge className="bg-purple-100 text-purple-800">Gemini AI</Badge>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security</CardTitle>
              <Shield className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Secured</div>
              <p className="text-xs text-muted-foreground">
                <Badge className="bg-orange-100 text-orange-800">OAuth + HTTPS</Badge>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Deployment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Deployment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Production Environment</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Platform:</span>
                      <span>Vercel</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Framework:</span>
                      <span>Next.js 14</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Runtime:</span>
                      <span>Node.js 18+</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database:</span>
                      <span>Neon PostgreSQL</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Integrations</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Google OAuth:</span>
                      <Badge variant="outline">Configured</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Gmail API:</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Calendar API:</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Gemini AI:</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>System Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Database</h4>
                <p className="text-sm text-muted-foreground mb-3">Monitor and manage database connections</p>
                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="font-medium">Status:</span> Connected
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Provider:</span> Neon
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">API Services</h4>
                <p className="text-sm text-muted-foreground mb-3">Monitor external API integrations</p>
                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="font-medium">Google APIs:</span> Active
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Gemini AI:</span> Active
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Security</h4>
                <p className="text-sm text-muted-foreground mb-3">Authentication and security status</p>
                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="font-medium">OAuth:</span> Configured
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">HTTPS:</span> Enforced
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
