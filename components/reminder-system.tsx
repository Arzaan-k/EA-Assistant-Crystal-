"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Plus, Clock, Check, Edit, Trash2, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Reminder {
  id: number
  title: string
  description: string
  dueDate: Date
  priority: "low" | "medium" | "high"
  completed: boolean
  category: string
}

const initialReminders: Reminder[] = [
  {
    id: 1,
    title: "Call John about project update",
    description: "Discuss the Q4 project timeline and deliverables",
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    priority: "high",
    completed: false,
    category: "Meeting",
  },
  {
    id: 2,
    title: "Review budget proposal",
    description: "Go through the marketing department's budget request",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    priority: "medium",
    completed: false,
    category: "Finance",
  },
  {
    id: 3,
    title: "Submit expense report",
    description: "Upload receipts and submit monthly expense report",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    priority: "low",
    completed: true,
    category: "Administrative",
  },
]

const priorityColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

export function ReminderSystem() {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders)
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as const,
    category: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const addReminder = () => {
    if (!newReminder.title || !newReminder.dueDate) return

    const reminder: Reminder = {
      id: reminders.length + 1,
      title: newReminder.title,
      description: newReminder.description,
      dueDate: new Date(newReminder.dueDate),
      priority: newReminder.priority,
      completed: false,
      category: newReminder.category || "General",
    }

    setReminders([...reminders, reminder])
    setNewReminder({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      category: "",
    })
    setIsDialogOpen(false)
  }

  const toggleComplete = (id: number) => {
    setReminders(
      reminders.map((reminder) => (reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder)),
    )
  }

  const deleteReminder = (id: number) => {
    setReminders(reminders.filter((reminder) => reminder.id !== id))
  }

  const formatDueDate = (date: Date) => {
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffMs < 0) return "Overdue"
    if (diffHours < 1) return "Due soon"
    if (diffHours < 24) return `Due in ${diffHours} hours`
    if (diffDays === 1) return "Due tomorrow"
    return `Due in ${diffDays} days`
  }

  const upcomingReminders = reminders.filter((r) => !r.completed && r.dueDate > new Date())
  const overdueReminders = reminders.filter((r) => !r.completed && r.dueDate < new Date())
  const completedReminders = reminders.filter((r) => r.completed)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Reminders</h2>
          <p className="text-muted-foreground">AI-powered task management and notifications</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  placeholder="What do you need to remember?"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newReminder.description}
                  onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="datetime-local"
                    value={newReminder.dueDate}
                    onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newReminder.priority}
                    onChange={(e) => setNewReminder({ ...newReminder, priority: e.target.value as any })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={newReminder.category}
                  onChange={(e) => setNewReminder({ ...newReminder, category: e.target.value })}
                  placeholder="e.g., Meeting, Finance, Administrative"
                />
              </div>
              <Button onClick={addReminder} className="w-full">
                Create Reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-500">{overdueReminders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Upcoming</p>
                <p className="text-2xl font-bold text-yellow-500">{upcomingReminders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-500">{completedReminders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-500">{reminders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Reminders */}
      {overdueReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Overdue Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center gap-3 p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20"
                >
                  <Button variant="outline" size="sm" onClick={() => toggleComplete(reminder.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{reminder.title}</h3>
                      <Badge className={priorityColors[reminder.priority]}>{reminder.priority}</Badge>
                      <Badge variant="outline">{reminder.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{reminder.description}</p>
                    <p className="text-xs text-red-600 font-medium mt-1">{formatDueDate(reminder.dueDate)}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => deleteReminder(reminder.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingReminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming reminders. You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Button variant="outline" size="sm" onClick={() => toggleComplete(reminder.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{reminder.title}</h3>
                      <Badge className={priorityColors[reminder.priority]}>{reminder.priority}</Badge>
                      <Badge variant="outline">{reminder.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{reminder.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDueDate(reminder.dueDate)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteReminder(reminder.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Reminders */}
      {completedReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Completed Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedReminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center gap-3 p-3 border rounded-lg opacity-60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleComplete(reminder.id)}
                    className="bg-green-100 border-green-300"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium line-through">{reminder.title}</h3>
                      <Badge className={priorityColors[reminder.priority]}>{reminder.priority}</Badge>
                      <Badge variant="outline">{reminder.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-through">{reminder.description}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => deleteReminder(reminder.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
