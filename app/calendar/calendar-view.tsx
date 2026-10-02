"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, type EventType } from "@/lib/constants";
import { EventDialog } from "./event-dialog";
import type { CalendarEventDTO } from "@/lib/types";

type ViewMode = "month" | "week" | "day";

function EventPill({ event, onClick }: { event: CalendarEventDTO; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex w-full items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-left text-xs hover:bg-muted"
      title={event.title}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: EVENT_TYPE_COLORS[event.type as EventType] }}
      />
      <span className="truncate">{event.title}</span>
    </button>
  );
}

export function CalendarView({
  initialEvents,
  clients,
}: {
  initialEvents: CalendarEventDTO[];
  clients: { id: string; name: string }[];
}) {
  const [events, setEvents] = useState<CalendarEventDTO[]>(initialEvents);
  const [view, setView] = useState<ViewMode>("month");
  const [current, setCurrent] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDefaultDate, setDialogDefaultDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEventDTO | null>(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventDTO[]>();
    for (const event of events) {
      const key = format(new Date(event.date), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    map.forEach((list) => {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return map;
  }, [events]);

  function eventsOn(day: Date) {
    return eventsByDay.get(format(day, "yyyy-MM-dd")) ?? [];
  }

  function openNewEvent(day: Date) {
    setEditingEvent(null);
    setDialogDefaultDate(day);
    setDialogOpen(true);
  }

  function openEditEvent(event: CalendarEventDTO) {
    setEditingEvent(event);
    setDialogDefaultDate(null);
    setDialogOpen(true);
  }

  function handleSaved(saved: CalendarEventDTO) {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === saved.id);
      return exists ? prev.map((e) => (e.id === saved.id ? saved : e)) : [...prev, saved];
    });
  }

  function handleDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function navigate(direction: 1 | -1) {
    if (view === "month") setCurrent((d) => addMonths(d, direction));
    else if (view === "week") setCurrent((d) => addWeeks(d, direction));
    else setCurrent((d) => addDays(d, direction));
  }

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(current));
    const end = endOfWeek(endOfMonth(current));
    return eachDayOfInterval({ start, end });
  }, [current]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(current);
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [current]);

  const headerLabel = useMemo(() => {
    if (view === "month") return format(current, "MMMM yyyy");
    if (view === "week") {
      const start = startOfWeek(current);
      const end = addDays(start, 6);
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    return format(current, "EEEE, MMMM d, yyyy");
  }, [view, current]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pt-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrent(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 text-base font-semibold">{headerLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" className="gap-1.5" onClick={() => openNewEvent(current)}>
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 px-8 text-xs text-muted-foreground">
        {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: EVENT_TYPE_COLORS[key as EventType] }}
            />
            {label}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-8 py-4">
        {view === "month" && (
          <div className="grid grid-cols-7 overflow-hidden rounded-lg border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="border-b bg-muted/40 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
            {monthDays.map((day) => {
              const dayEvents = eventsOn(day);
              return (
                <div
                  key={day.toISOString()}
                  role="button"
                  tabIndex={0}
                  onClick={() => openNewEvent(day)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openNewEvent(day);
                  }}
                  className={cn(
                    "flex min-h-[6.5rem] cursor-pointer flex-col items-stretch gap-1 border-b border-r p-1.5 text-left align-top last:border-r-0 hover:bg-muted/30",
                    !isSameMonth(day, current) && "bg-muted/10 text-muted-foreground/50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      isToday(day) && "bg-brand font-semibold text-brand-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <EventPill key={event.id} event={event} onClick={() => openEditEvent(event)} />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="px-1.5 text-[0.65rem] text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === "week" && (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayEvents = eventsOn(day);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => openNewEvent(day)}
                  className="flex min-h-[20rem] cursor-pointer flex-col gap-1.5 rounded-lg border p-2 hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{format(day, "EEE")}</span>
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                        isToday(day) && "bg-brand font-semibold text-brand-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditEvent(event);
                        }}
                        className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: EVENT_TYPE_COLORS[event.type as EventType] }}
                          />
                          <span className="font-medium">{format(new Date(event.date), "h:mm a")}</span>
                        </div>
                        <p className="truncate">{event.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === "day" && (
          <div
            onClick={() => openNewEvent(current)}
            className="min-h-[20rem] cursor-pointer space-y-2 rounded-lg border p-4 hover:bg-muted/20"
          >
            {eventsOn(current).length === 0 && (
              <p className="text-sm text-muted-foreground">No events today. Click to add one.</p>
            )}
            {eventsOn(current).map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  openEditEvent(event);
                }}
                className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: EVENT_TYPE_COLORS[event.type as EventType] }}
                  />
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {EVENT_TYPE_LABELS[event.type as EventType]}
                      {event.client ? ` · ${event.client.name}` : ""}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(event.date), "h:mm a")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={dialogDefaultDate}
        event={editingEvent}
        clients={clients}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
