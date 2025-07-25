"use client"

import { useState, useEffect } from "react"
import { Search, ChevronRight, AlertTriangle, CheckCircle, Clock, XCircle, LogOut, User } from "lucide-react"
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data
const projects = [
  { id: 1, name: "E-Commerce Platform", passRate: 87, stories: 45, epics: 8 },
  { id: 2, name: "Mobile Banking App", passRate: 92, stories: 32, epics: 6 },
  { id: 3, name: "Healthcare Portal", passRate: 78, stories: 28, epics: 5 },
  { id: 4, name: "Analytics Dashboard", passRate: 95, stories: 22, epics: 4 },
  { id: 5, name: "Social Media API", passRate: 83, stories: 38, epics: 7 },
  { id: 6, name: "Payment Gateway", passRate: 89, stories: 19, epics: 3 },
  { id: 7, name: "Content Management", passRate: 76, stories: 41, epics: 9 },
  { id: 8, name: "User Authentication", passRate: 94, stories: 15, epics: 3 },
]

const epics = [
  { id: 1, name: "User Registration", stories: 8, passRate: 85, height: 8 },
  { id: 2, name: "Product Catalog", stories: 12, passRate: 92, height: 12 },
  { id: 3, name: "Shopping Cart", stories: 6, passRate: 78, height: 6 },
  { id: 4, name: "Payment Processing", stories: 10, passRate: 88, height: 10 },
  { id: 5, name: "Order Management", stories: 9, passRate: 91, height: 9 },
  { id: 6, name: "User Profile", stories: 7, passRate: 83, height: 7 },
  { id: 7, name: "Notifications", stories: 5, passRate: 95, height: 5 },
  { id: 8, name: "Analytics", stories: 4, passRate: 87, height: 4 },
]

const stories = [
  {
    id: 1,
    name: "User can create account with valid email",
    passRate: 90,
    tests: 8,
    passing: 7,
    partial: 1,
    breaking: 0,
    pending: 0,
    status: "passing",
  },
  {
    id: 2,
    name: "Email verification works correctly",
    passRate: 85,
    tests: 5,
    passing: 4,
    partial: 0,
    breaking: 1,
    pending: 0,
    status: "passing",
  },
  {
    id: 3,
    name: "Password reset flow functions properly",
    passRate: 70,
    tests: 6,
    passing: 3,
    partial: 2,
    breaking: 1,
    pending: 0,
    status: "partial",
  },
  {
    id: 4,
    name: "Social login integration with OAuth providers",
    passRate: 45,
    tests: 4,
    passing: 1,
    partial: 1,
    breaking: 2,
    pending: 0,
    status: "breaking",
  },
  {
    id: 5,
    name: "Profile completion wizard guides users",
    passRate: 95,
    tests: 7,
    passing: 6,
    partial: 1,
    breaking: 0,
    pending: 0,
    status: "passing",
  },
  {
    id: 6,
    name: "Account deactivation process handles cleanup",
    passRate: 0,
    tests: 3,
    passing: 0,
    partial: 0,
    breaking: 0,
    pending: 3,
    status: "pending",
  },
]

const tests = [
  { id: 1, name: "Valid email format validation", status: "passing", duration: "1.2s" },
  { id: 2, name: "Password strength requirements", status: "passing", duration: "0.8s" },
  { id: 3, name: "Duplicate email prevention", status: "passing", duration: "2.1s" },
  { id: 4, name: "Terms acceptance required", status: "breaking", duration: "0.5s" },
  { id: 5, name: "Age verification check", status: "partial", duration: "1.8s" },
  { id: 6, name: "GDPR compliance fields", status: "pending", duration: "-" },
  {id: 7, name: "Here is one more test case coz why not", status: "pending"}
]

// Helper function to calculate aggregated test data for epics
const getEpicAggregatedData = (epicId: number) => {
  // Get all stories for this epic (in real app, this would be filtered by epic)
  const epicStories = stories.slice(0, Math.min(stories.length, 4)) // Mock: take first 4 stories for this epic

  const aggregated = epicStories.reduce(
    (acc, story) => ({
      passing: acc.passing + story.passing,
      partial: acc.partial + story.partial,
      breaking: acc.breaking + story.breaking,
      pending: acc.pending + story.pending,
      tests: acc.tests + story.tests,
    }),
    { passing: 0, partial: 0, breaking: 0, pending: 0, tests: 0 },
  )

  const passRate = aggregated.tests > 0 ? Math.round((aggregated.passing / aggregated.tests) * 100) : 0

  return { ...aggregated, passRate }
}

const StackedProgressBar = ({
  passing,
  partial,
  breaking,
  pending,
  total,
}: {
  passing: number
  partial: number
  breaking: number
  pending: number
  total: number
}) => {
  const passingPercent = (passing / total) * 100
  const partialPercent = (partial / total) * 100
  const breakingPercent = (breaking / total) * 100
  const pendingPercent = (pending / total) * 100

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
      {passing > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${passingPercent}%` }} />}
      {partial > 0 && (
        <div className="bg-amber-500 h-full border-l border-white" style={{ width: `${partialPercent}%` }} />
      )}
      {breaking > 0 && (
        <div className="bg-red-500 h-full border-l border-white" style={{ width: `${breakingPercent}%` }} />
      )}
      {pending > 0 && (
        <div className="bg-gray-400 h-full border-l border-white" style={{ width: `${pendingPercent}%` }} />
      )}
    </div>
  )
}

const StatusDistributionPieChart = ({
  passing,
  partial,
  breaking,
  pending,
  total,
  size = 128,
}: {
  passing: number
  partial: number
  breaking: number
  pending: number
  total: number
  size?: number
}) => {
  if (total === 0) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-full h-full rounded-full border-8 border-gray-200"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900">0</span>
        </div>
      </div>
    )
  }

  // Transform data for Recharts
  const data = [
    { name: 'Passing', value: passing, color: '#10b981' },
    { name: 'Partial', value: partial, color: '#f59e0b' },
    { name: 'Breaking', value: breaking, color: '#ef4444' },
    { name: 'Pending', value: pending, color: '#9ca3af' }
  ].filter(item => item.value > 0)

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="px-3 py-2 bg-white text-black text-sm rounded-lg shadow-lg whitespace-nowrap border border-gray-200">
          {`${data.name}: ${data.value} test${data.value !== 1 ? 's' : ''}`}
        </div>
      )
    }
    return null
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={size / 2}
          cy={size / 2}
          innerRadius={size * 0.25}
          outerRadius={size * 0.4}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </div>
  )
}

export default function PrismUniverse() {
  const [selectedProject, setSelectedProject] = useState(projects[0])
  const [selectedEpic, setSelectedEpic] = useState<(typeof epics)[0] | null>(null)
  const [selectedStory, setSelectedStory] = useState<(typeof stories)[0] | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [filter, setFilter] = useState("all")

  const [user] = useState({
    name: "Alex Chen",
    email: "alex.chen@company.com",
    avatar: "/placeholder.svg?height=32&width=32",
  })

  const handleLogout = () => {
    // Handle logout logic here
    console.log("User logged out")
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const getPassRateColor = (rate: number) => {
    if (rate >= 90) return "bg-emerald-500"
    if (rate >= 70) return "bg-amber-500"
    if (rate >= 50) return "bg-orange-500"
    return "bg-red-500"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passing":
        return "text-emerald-600 bg-emerald-50"
      case "partial":
        return "text-amber-600 bg-amber-50"
      case "breaking":
        return "text-red-600 bg-red-50"
      case "pending":
        return "text-gray-600 bg-gray-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passing":
        return <CheckCircle className="w-4 h-4" />
      case "partial":
        return <AlertTriangle className="w-4 h-4" />
      case "breaking":
        return <XCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? "w-80" : "w-0"} overflow-hidden`}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500 mt-1">{projects.length} active projects</p>
        </div>
        <div className="p-4 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                selectedProject.id === project.id
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => {
                setSelectedProject(project)
                setSidebarOpen(false)
                setSelectedEpic(null)
                setSelectedStory(null)
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm">{project.name}</h3>
                <span className="text-xs text-gray-500">{project.passRate}%</span>
              </div>
              <Progress value={project.passRate} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{project.epics} epics</span>
                <span>{project.stories} stories</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600">
                <div className="w-4 h-4 flex flex-col justify-center space-y-1">
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                </div>
              </Button>
              <h1 className="text-xl font-bold text-gray-900">{"DX Test Hub"} </h1>
              <Badge variant="outline" className="border-emerald-200 text-slate-50 border bg-green-500">
                {selectedProject.name}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="text-gray-600 font-medium"
                aria-label="Open Search"
                title="Open Search"
              >
                <Search className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="ml-2 px-0.5 py-0.5 bg-gray-100 rounded text-xs tracking-[0.2em] tracking-widest">⌘K </kbd>
              </Button>

              <div className="text-sm text-gray-500">Last updated: {currentTime.toLocaleTimeString()}</div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Canvas Area */}
          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg border border-gray-200 h-full relative overflow-hidden">
              {!selectedEpic ? (
                // Epic View - replace the existing epic cubes section
                <div className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">E-Commerce Platform</h2>
                    <p className="text-gray-600">Click on an epic to explore its stories</p>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {epics.map((epic) => {
                      const aggregatedData = getEpicAggregatedData(epic.id)
                      return (
                        <Card
                          key={epic.id}
                          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 group"
                          onClick={() => setSelectedEpic(epic)}
                        >
                          <CardContent className="p-4">
                            <h3 className="font-medium text-gray-900 text-sm mb-3 leading-tight min-h-[2.5rem]">
                              {epic.name}
                            </h3>

                            <div className="relative group/progress">
                              <StackedProgressBar
                                passing={aggregatedData.passing}
                                partial={aggregatedData.partial}
                                breaking={aggregatedData.breaking}
                                pending={aggregatedData.pending}
                                total={aggregatedData.tests}
                              />

                              <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover/progress:opacity-100 transition-opacity duration-200 z-10">
                                <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg min-w-[200px]">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <span>Passing</span>
                                      </div>
                                      <span className="font-medium">{aggregatedData.passing}</span>
                                    </div>
                                    {aggregatedData.partial > 0 && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                          <span>Partial</span>
                                        </div>
                                        <span className="font-medium">{aggregatedData.partial}</span>
                                      </div>
                                    )}
                                    {aggregatedData.breaking > 0 && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                          <span>Breaking</span>
                                        </div>
                                        <span className="font-medium">{aggregatedData.breaking}</span>
                                      </div>
                                    )}
                                    {aggregatedData.pending > 0 && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                          <span>Pending</span>
                                        </div>
                                        <span className="font-medium">{aggregatedData.pending}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="border-t border-gray-700 mt-2 pt-2">
                                    <div className="flex items-center justify-between font-medium">
                                      <span>Total</span>
                                      <span>{aggregatedData.tests}</span>
                                    </div>
                                  </div>
                                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ) : !selectedStory ? (
                // Story View - replace the existing story view section
                <div className="p-8">
                  <div className="mb-6">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedEpic(null)} className="mb-4">
                      ← Back to Epics
                    </Button>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-bold text-black">{selectedEpic.name}</h2>

                      {/* Inline Pie Chart */}
                      <div className="flex items-center space-x-4">
                        <div className="relative w-24 h-24">
                          <PieChart width={96} height={96}>
                            <Pie
                              data={[
                                { name: 'Passing', value: getEpicAggregatedData(selectedEpic.id).passing, color: '#10b981' },
                                { name: 'Partial', value: getEpicAggregatedData(selectedEpic.id).partial, color: '#f59e0b' },
                                { name: 'Breaking', value: getEpicAggregatedData(selectedEpic.id).breaking, color: '#ef4444' },
                                { name: 'Pending', value: getEpicAggregatedData(selectedEpic.id).pending, color: '#9ca3af' }
                              ].filter(item => item.value > 0)}
                              cx={48}
                              cy={48}
                              innerRadius={25}
                              outerRadius={40}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {[
                                { name: 'Passing', value: getEpicAggregatedData(selectedEpic.id).passing, color: '#10b981' },
                                { name: 'Partial', value: getEpicAggregatedData(selectedEpic.id).partial, color: '#f59e0b' },
                                { name: 'Breaking', value: getEpicAggregatedData(selectedEpic.id).breaking, color: '#ef4444' },
                                { name: 'Pending', value: getEpicAggregatedData(selectedEpic.id).pending, color: '#9ca3af' }
                              ].filter(item => item.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={({ active, payload }: any) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="px-3 py-2 bg-white text-black text-sm rounded-lg shadow-lg whitespace-nowrap border border-gray-200">
                                    {`${data.name}: ${data.value} test${data.value !== 1 ? 's' : ''}`}
                                  </div>
                                )
                              }
                              return null
                            }} />
                          </PieChart>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className={`font-semibold text-lg ${
                            getEpicAggregatedData(selectedEpic.id).passRate <= 30 
                              ? 'text-red-500' 
                              : getEpicAggregatedData(selectedEpic.id).passRate <= 75 
                                ? 'text-amber-500' 
                                : 'text-emerald-500'
                          }`}>
                            {getEpicAggregatedData(selectedEpic.id).passRate}% Pass Rate
                          </div>
                          <div>{getEpicAggregatedData(selectedEpic.id).tests} total tests</div>
                          <div>{getEpicAggregatedData(selectedEpic.id).passing} passing</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-500">Click on a story to view its details in the sidebar</p>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {stories.map((story) => (
                      <Card
                        key={story.id}
                        className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 group ${
                          selectedStory?.id === story.id ? "ring-2 ring-emerald-500 bg-emerald-50" : ""
                        }`}
                        onClick={() => setSelectedStory(story)}
                      >
                        <CardContent className="p-4">
                          <h3 className="font-medium text-gray-900 text-sm mb-3 leading-tight min-h-[2.5rem]">
                            {story.name}
                          </h3>

                          <div className="relative group/progress">
                            <StackedProgressBar
                              passing={story.passing}
                              partial={story.partial}
                              breaking={story.breaking}
                              pending={story.pending}
                              total={story.tests}
                            />

                            <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover/progress:opacity-100 transition-opacity duration-200 z-10">
                              <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg min-w-[200px]">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                      <span>Passing</span>
                                    </div>
                                    <span className="font-medium">{story.passing}</span>
                                  </div>
                                  {story.partial > 0 && (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                        <span>Partial</span>
                                      </div>
                                      <span className="font-medium">{story.partial}</span>
                                    </div>
                                  )}
                                  {story.breaking > 0 && (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span>Breaking</span>
                                      </div>
                                      <span className="font-medium">{story.breaking}</span>
                                    </div>
                                  )}
                                  {story.pending > 0 && (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <span>Pending</span>
                                      </div>
                                      <span className="font-medium">{story.pending}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="border-t border-gray-700 mt-2 pt-2">
                                  <div className="flex items-center justify-between font-medium">
                                    <span>Total</span>
                                    <span>{story.tests}</span>
                                  </div>
                                </div>
                                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                // Test View
                <></>
              )}
            </div>
          </div>

          {/* Right Panel - Updated for story-focused view */}
          {selectedEpic && (
            <div className="w-80 bg-white border-l border-gray-200 p-6">
              {!selectedStory ? (
                // Empty state when no story is selected
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Story</h3>
                  <p className="text-sm text-gray-500">
                    Click on any story card to view detailed information and test results here.
                  </p>
                </div>
              ) : (
                // Story details when a story is selected
                <div>
                  <div className="mb-6">
                    <div className="flex text-sm text-gray-500 mb-4 items-center">
                      
                      
                      
                      
                      <span className="text-black font-medium text-lg">{selectedStory.name}</span>
                    </div>

                    {/* Story Status Distribution Pie Chart */}
                    <div className="flex items-center justify-center mb-6">
                      <StatusDistributionPieChart
                        passing={selectedStory.passing}
                        partial={selectedStory.partial}
                        breaking={selectedStory.breaking}
                        pending={selectedStory.pending}
                        total={selectedStory.tests}
                        size={128}
                      />
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Test Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Tests</span>
                        <span className="font-medium">{selectedStory.tests}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pass Rate</span>
                        <span className="font-medium text-emerald-600">{selectedStory.passRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Last Run</span>
                        <span className="font-medium">2 min ago</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Duration</span>
                        <span className="font-medium">1.2s avg</span>
                      </div>
                    </div>
                  </div>

                  {/* Test History Line Chart */}
                  

                  {/* Test Cases Table */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Test Cases</h3>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {tests
                        .sort((a, b) => {
                          const statusOrder = { breaking: 0, partial: 1, pending: 2, passing: 3 }
                          return statusOrder[a.status] - statusOrder[b.status]
                        })
                        .map((test) => (
                          <div
                            key={test.id}
                            className={`p-3 rounded-lg text-sm ${getStatusColor(test.status)} flex items-center justify-between`}
                          >
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(test.status)}
                              <span className="font-medium text-xs">{test.name}</span>
                            </div>
                            <span className="text-xs text-gray-600">{test.duration}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Crystal FAB */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg transform rotate-45"
            size="icon"
          >
            <div className="transform -rotate-45">
              <div className="w-6 h-6 bg-white/20 rounded transform rotate-45 mb-1"></div>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Generation</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="tests" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tests">Generate Tests</TabsTrigger>
              <TabsTrigger value="stories">Generate Stories</TabsTrigger>
            </TabsList>
            <TabsContent value="tests" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Number of test ideas</label>
                <Input type="number" defaultValue="5" className="mt-1" />
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Generate Test Ideas</Button>
            </TabsContent>
            <TabsContent value="stories" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Number of user stories</label>
                <Input type="number" defaultValue="3" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Target Epic</label>
                <Input defaultValue={selectedEpic?.name || "Select an epic first"} className="mt-1" />
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Generate User Stories</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Global Search */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Global Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Search projects, epics, stories..." className="w-full" autoFocus />
            <div className="text-sm text-gray-500">Use ⌘K to open search from anywhere</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
