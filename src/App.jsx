import { useState, useEffect, useCallback, useMemo } from 'react'
import { AlertCircle, CheckCheck } from 'lucide-react'
import Header from './components/Header'
import CalendarView from './components/CalendarView'
import TodoInput from './components/TodoInput'
import TodoFilter from './components/TodoFilter'
import TodoItem from './components/TodoItem'
import {
  getMonthSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  clearCompletedForDate,
} from './services/api'

const getToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState(getToday)
  const [currentYearMonth, setCurrentYearMonth] = useState(() => getToday().slice(0, 7))
  const [allMonthTodos, setAllMonthTodos] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dbError, setDbError] = useState(null)

  const loadSchedules = useCallback(async (ym) => {
    try {
      const data = await getMonthSchedules(ym)
      setAllMonthTodos(data)
      setDbError(null)
    } catch (e) {
      console.error(e)
      setDbError(e.message)
    }
  }, [])

  useEffect(() => {
    loadSchedules(currentYearMonth)
  }, [currentYearMonth, loadSchedules])

  const monthlyCounts = useMemo(() => {
    const map = {}
    allMonthTodos.forEach((item) => {
      if (!map[item.date]) map[item.date] = { total: 0, completed: 0 }
      map[item.date].total += 1
      if (item.completed) map[item.date].completed += 1
    })
    return map
  }, [allMonthTodos])

  const currentDayTodos = useMemo(
    () => allMonthTodos.filter((t) => t.date === selectedDate),
    [allMonthTodos, selectedDate]
  )

  const handleAddTodo = async (title, priority) => {
    try {
      const created = await createSchedule({ title, date: selectedDate, priority })
      setAllMonthTodos((prev) => [created, ...prev])
    } catch (e) {
      alert(e.message || '일정 등록 실패')
    }
  }

  const handleToggle = async (id) => {
    const target = allMonthTodos.find((t) => t.id === id)
    if (!target) return
    const nextCompleted = !target.completed
    setAllMonthTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
    )
    try {
      await updateSchedule(id, { completed: nextCompleted })
    } catch {
      setAllMonthTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !nextCompleted } : t))
      )
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteSchedule(id)
      setAllMonthTodos((prev) => prev.filter((t) => t.id !== id))
    } catch (e) {
      alert(e.message || '일정 삭제 실패')
    }
  }

  const handleEdit = async (id, title) => {
    try {
      await updateSchedule(id, { title })
      setAllMonthTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title } : t))
      )
    } catch (e) {
      alert(e.message || '일정 수정 실패')
    }
  }

  const handleClearCompleted = async () => {
    if (!window.confirm(`${selectedDate}의 완료된 일정을 모두 삭제하시겠습니까?`)) return
    try {
      await clearCompletedForDate(selectedDate)
      setAllMonthTodos((prev) =>
        prev.filter((t) => !(t.date === selectedDate && t.completed))
      )
    } catch (e) {
      alert(e.message || '완료 항목 삭제 실패')
    }
  }

  const totalCount = currentDayTodos.length
  const completedCount = currentDayTodos.filter((t) => t.completed).length
  const activeCount = totalCount - completedCount
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  const filteredTodos = currentDayTodos.filter((todo) => {
    const match = filter === 'all' ? true : filter === 'active' ? !todo.completed : todo.completed
    const matchSearch = (todo.title || todo.text || '').toLowerCase().includes(search.toLowerCase())
    return match && matchSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {dbError && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs px-4 py-3 rounded-2xl mb-4 flex items-center justify-between shadow-sm">
            <span className="font-medium">⚠️ {dbError}</span>
            <button
              type="button"
              onClick={() => loadSchedules(currentYearMonth)}
              className="text-indigo-600 hover:text-indigo-800 underline font-bold ml-3 flex-shrink-0 cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        )}

        <CalendarView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentYearMonth={currentYearMonth}
          onChangeYearMonth={setCurrentYearMonth}
          monthlyScheduleCounts={monthlyCounts}
        />

        <Header
          selectedDate={selectedDate}
          totalCount={totalCount}
          completedCount={completedCount}
          progressPercent={progressPercent}
        />

        <TodoInput onAdd={handleAddTodo} selectedDate={selectedDate} />

        <TodoFilter
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
          counts={{ total: totalCount, active: activeCount, completed: completedCount }}
        />

        <main className="space-y-2.5">
          {filteredTodos.length === 0 ? (
            <div className="bg-white/60 border border-dashed border-slate-200 rounded-2xl p-10 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-slate-600 font-medium text-sm">
                {search
                  ? `'${search}' 검색 결과가 없습니다.`
                  : `${selectedDate}에 등록된 일정이 없습니다.`}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={{
                  id: todo.id,
                  text: todo.title || todo.text,
                  completed: todo.completed,
                  priority: todo.priority,
                  createdAt: todo.date,
                }}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))
          )}
        </main>

        {completedCount > 0 && (
          <footer className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleClearCompleted}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>완료 항목 삭제 ({completedCount})</span>
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}

