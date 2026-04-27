import { Bell, ShieldCheck, UserRound } from 'lucide-react'
import { CLIAuthBridge } from '@/components/auth/CLIAuthBridge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/authStore'

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="app-page max-w-4xl">
      <div className="page-heading">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your profile, CLI access, and preferences.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-rs-surface">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="cli">CLI authentication</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card className="surface-panel">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-rs-link" />
                <CardTitle>Public Profile</CardTitle>
              </div>
              <CardDescription>Information shown on your RepoSphere profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-6">
                <Avatar className="size-20 border border-rs-border bg-rs-elevated">
                  <AvatarImage src={user?.imageUrl ?? undefined} />
                  <AvatarFallback className="bg-rs-elevated text-xl">{user?.name?.[0] ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="disp">Display name</Label>
                  <Input id="disp" defaultValue={user?.name ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc">Location</Label>
                  <Input id="loc" placeholder="City, Country" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" placeholder="Short bio" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="web">Website</Label>
                  <Input id="web" type="url" placeholder="https://" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-rs-accent" />
                <CardTitle>Account Security</CardTitle>
              </div>
              <CardDescription>Password and provider management will be configurable here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                RepoSphere native authentication is active for this account.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cli" className="mt-6">
          <CLIAuthBridge />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="surface-panel">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-rs-warm" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Email preferences for account activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Product updates</p>
                  <p className="text-xs text-muted-foreground">News and releases from RepoSphere</p>
                </div>
                <input type="checkbox" defaultChecked className="size-4 rounded border-input" aria-label="Product updates" />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Security alerts</p>
                  <p className="text-xs text-muted-foreground">Login and token activity</p>
                </div>
                <input type="checkbox" defaultChecked className="size-4 rounded border-input" aria-label="Security alerts" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
