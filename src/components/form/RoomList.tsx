'use client';

import type { RoomInput } from '@/lib/calc/types';
import { RoomEditor } from './RoomEditor';
import { Button } from '@/components/ui/Button';

interface Props {
  rooms: RoomInput[];
  onChange: (rooms: RoomInput[]) => void;
}

const DEFAULT_ROOM: RoomInput = {
  name: '',
  squareFootage: 200,
  ceilingHeight: 8,
  ceilingType: 'flat',
  walls: [
    { orientation: 'N', length: 14, rValue: 13, mass: 'light', partyWall: false },
    { orientation: 'S', length: 14, rValue: 13, mass: 'light', partyWall: false },
    { orientation: 'E', length: 14, rValue: 13, mass: 'light', partyWall: false },
    { orientation: 'W', length: 14, rValue: 13, mass: 'light', partyWall: false },
  ],
  windows: [
    { orientation: 'S', width: 3, height: 4, uValue: 0.28, shgc: 0.38 },
  ],
};

export function RoomList({ rooms, onChange }: Props) {
  function addRoom() {
    const idx = rooms.length + 1;
    const name =
      idx === 1
        ? 'Living Room'
        : idx === 2
          ? 'Kitchen'
          : idx === 3
            ? 'Primary Bedroom'
            : `Room ${idx}`;
    onChange([...rooms, { ...DEFAULT_ROOM, name }]);
  }

  function updateRoom(index: number, room: RoomInput) {
    const next = [...rooms];
    next[index] = room;
    onChange(next);
  }

  function removeRoom(index: number) {
    onChange(rooms.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Rooms ({rooms.length})
        </h3>
        <Button type="button" variant="secondary" onClick={addRoom}>
          + Add room
        </Button>
      </div>
      {rooms.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          No rooms defined. The calculator will use whole-house mode.
          Click <strong>+ Add room</strong> to switch to room-by-room.
        </p>
      )}
      {rooms.map((room, i) => (
        <RoomEditor
          key={i}
          room={room}
          index={i}
          onChange={(r) => updateRoom(i, r)}
          onRemove={() => removeRoom(i)}
        />
      ))}
      {rooms.length > 0 && (
        <Button type="button" variant="secondary" onClick={addRoom} className="w-full">
          + Add another room
        </Button>
      )}
    </div>
  );
}
