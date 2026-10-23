'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// A vertical list the user reorders by dragging. Built on dnd-kit, so it comes
// with pointer and keyboard dragging (focus the handle, Space to pick up,
// arrows to move, Space to drop) and collision handling for free.
//
// Two grips, by `handle`:
//   true   a grip icon at the left edge is the only draggable spot; the row's
//          own buttons and links keep working (the right default for rows
//          with controls)
//   false  the whole row drags (for plain rows with nothing clickable inside)
//
// The list is controlled: `onReorder` receives the new id order and the
// caller persists it, which is also when the rows actually move.

export type SortableItem = { id: string };

type SortableListProps<T extends SortableItem> = {
  items: T[];
  onReorder: (ids: string[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  handle?: boolean;
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
};

export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  handle = true,
  className = '',
  itemClassName = '',
  disabled = false,
}: SortableListProps<T>) {
  const sensors = useSensors(
    // A few pixels of travel before a drag starts, so clicks inside a
    // whole-row-draggable item still register as clicks.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = items.map((item) => item.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              id={item.id}
              handle={handle}
              disabled={disabled}
              className={itemClassName}
            >
              {renderItem(item, index)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function GripIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
      aria-hidden="true"
    >
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function SortableRow({
  id,
  handle,
  disabled,
  className,
  children,
}: {
  id: string;
  handle: boolean;
  disabled: boolean;
  className: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragProps = disabled ? {} : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      data-sortable-id={id}
      style={style}
      className={`relative flex items-stretch ${
        isDragging ? 'z-10 bg-white shadow-md dark:bg-neutral-900' : ''
      } ${
        !handle && !disabled ? 'cursor-grab active:cursor-grabbing' : ''
      } ${className}`}
      {...(handle ? {} : dragProps)}
    >
      {handle && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label="Drag to reorder"
          disabled={disabled}
          className="flex shrink-0 cursor-grab touch-none items-center px-2 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 active:cursor-grabbing disabled:cursor-default disabled:opacity-40 dark:text-neutral-500 dark:hover:text-neutral-200 dark:focus-visible:ring-neutral-500"
          {...dragProps}
        >
          <GripIcon />
        </button>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
