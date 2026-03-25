import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconDatabase,
  IconCategory,
  IconLanguage,
  IconLoader2,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { SiteHeader } from "@/components/superAdmin/site-header"
import {
  getKnowledgeEntries,
  addKnowledgeEntry,
  deleteKnowledgeEntry,
  type KnowledgeEntry,
} from "@/Apis/ChatbotApi"

const KnowledgeBase = () => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [filtered, setFiltered] = useState<KnowledgeEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [category, setCategory] = useState("general")
  const [language, setLanguage] = useState("en")

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const data = await getKnowledgeEntries()
      setEntries(data)
      setFiltered(data)
    } catch (error) {
      console.error("Failed to fetch knowledge entries:", error)
      toast.error("Failed to load knowledge base")
      setEntries([])
      setFiltered([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    if (!searchTerm) {
      setFiltered(entries)
      return
    }
    const term = searchTerm.toLowerCase()
    setFiltered(
      entries.filter(
        (e) =>
          e.question.toLowerCase().includes(term) ||
          e.answer.toLowerCase().includes(term) ||
          e.category.toLowerCase().includes(term)
      )
    )
  }, [searchTerm, entries])

  const handleAdd = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Question and answer are required")
      return
    }
    setCreating(true)
    try {
      await addKnowledgeEntry({ question, answer, category, language })
      toast.success("FAQ entry added")
      setQuestion("")
      setAnswer("")
      setCategory("general")
      setLanguage("en")
      setIsDialogOpen(false)
      fetchEntries()
    } catch (error) {
      console.error("Failed to add entry:", error)
      toast.error("Failed to add FAQ entry")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ entry?")) return
    try {
      await deleteKnowledgeEntry(entryId)
      toast.success("FAQ entry deleted")
      fetchEntries()
    } catch (error) {
      console.error("Failed to delete entry:", error)
      toast.error("Failed to delete FAQ entry")
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete all ${entries.length} FAQ entries? This cannot be undone.`)) return
    try {
      await Promise.all(entries.map((e) => deleteKnowledgeEntry(e.id)))
      toast.success("All FAQ entries deleted")
      fetchEntries()
    } catch (error) {
      console.error("Failed to delete all entries:", error)
      toast.error("Failed to delete all entries")
    }
  }

  const getCategoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-100 text-blue-800",
      payments: "bg-green-100 text-green-800",
      support: "bg-yellow-100 text-yellow-800",
    }
    return (
      <Badge variant="outline" className={`${colors[cat] || "bg-gray-100 text-gray-800"} flex items-center gap-1`}>
        <IconCategory className="h-3 w-3" />
        {cat}
      </Badge>
    )
  }

  const categories = [...new Set(entries.map((e) => e.category))]

  return (
    <div>
      <SiteHeader title="Knowledge Base" />
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Manage FAQ entries for the Davaam chatbot knowledge base
          </p>
          <div className="flex gap-2">
            {entries.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteAll}>
                <IconTrash className="mr-2 h-4 w-4" /> Delete All
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm">Total FAQs</CardTitle>
              <IconDatabase className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm">Categories</CardTitle>
              <IconCategory className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm">Languages</CardTitle>
              <IconLanguage className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {[...new Set(entries.map((e) => e.language))].length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle>FAQ Entries</CardTitle>
                <CardDescription>
                  Add, search, and manage chatbot knowledge base entries
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-600 hover:bg-teal-700">
                    <IconPlus className="mr-2 h-4 w-4" /> Add FAQ
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add FAQ Entry</DialogTitle>
                    <DialogDescription>
                      Add a new question and answer to the chatbot knowledge base
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="question">Question</Label>
                      <Input
                        id="question"
                        placeholder="e.g. How do I top up my account?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="answer">Answer</Label>
                      <Textarea
                        id="answer"
                        placeholder="Enter the answer..."
                        rows={4}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="payments">Payments</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="machines">Machines</SelectItem>
                            <SelectItem value="account">Account</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="language">Language</Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger id="language">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ur">Urdu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={handleAdd}
                      disabled={creating || !question.trim() || !answer.trim()}
                    >
                      {creating && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Entry
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex gap-4 pt-4">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by question, answer, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <IconLoader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading...</span>
              </div>
            ) : (
              <div className="rounded-2xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-teal-600 text-white hover:bg-teal-700">
                      <TableHead className="text-center font-semibold text-white border-none">
                        Question
                      </TableHead>
                      <TableHead className="text-center font-semibold text-white border-none">
                        Answer
                      </TableHead>
                      <TableHead className="text-center font-semibold text-white border-none">
                        Category
                      </TableHead>
                      <TableHead className="text-center font-semibold text-white border-none">
                        Language
                      </TableHead>
                      <TableHead className="text-center font-semibold text-white border-none">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length > 0 ? (
                      filtered.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-muted/50">
                          <TableCell className="max-w-[250px]">
                            <span className="line-clamp-2">{entry.question}</span>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <span className="line-clamp-2">{entry.answer}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {getCategoryBadge(entry.category)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{entry.language.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No FAQ entries found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between px-4 mt-4">
                <div className="text-muted-foreground text-sm">
                  Showing {filtered.length} of {entries.length} entries
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default KnowledgeBase
