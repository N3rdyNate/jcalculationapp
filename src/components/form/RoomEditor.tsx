'use client';

import type { RoomInput, RoomWallInput, RoomWindowInput } from '@/lib/calc/types';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface Props {
  room: RoomInput;
  index: number;
  onChange: (room: RoomInput) => void;
  onRemove: () => void;
}

const DEFAULT_WALL: RoomWallInput = {
  orientation: 'N',
  length: 20,
  rValue: 13,
  mass: 'light',
  partyWall: false,
};

const DEFAULT_WINDOW: RoomWindowInput = {
  orientation: 'S',
  width: 3,
  height: 4,
  uValue: 0.28,
  shgc: 0.38,
};

export function RoomEditor({ room, index, onChange, onRemove }: Props) {
  function updateField<K extends keyof RoomInput>(key: K, value: RoomInput[K]) {
    onChange({ ...room, [key]: value });
  }

  function updateWall(i: number, patch: Partial<RoomWallInput>) {
    const walls = [...room.walls];
    walls[i] = { ...walls[i], ...patch };
    onChange({ ...room, walls });
  }

  function addWall() {
    onChange({ ...room, walls: [...room.walls, { ...DEFAULT_WALL }] });
  }

  function removeWall(i: number) {
    onChange({ ...room, walls: room.walls.filter((_, j) => j !== i) });
  }

  function updateWindow(i: number, patch: Partial<RoomWindowInput>) {
    const windows = [...room.windows];
    windows[i] = { ...windows[i], ...patch };
    onChange({ ...room, windows });
  }

  function addWindow() {
    onChange({ ...room, windows: [...room.windows, { ...DEFAULT_WINDOW }] });
  }

  function removeWindow(i: number) {
    onChange({ ...room, windows: room.windows.filter((_, j) => j !== i) });
  }

  return (
    <Card
      title={`Room ${index + 1}: ${room.name || 'Unnamed'}`}
      description="Walls, windows, and dimensions for this room"
    >
      {/* Room basics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Field label="Name">
          <Input value={room.name} onChange={(e) => updateField('name', e.target.value)} />
        </Field>
        <Field label="Sq ft">
          <Input type="number" step="1" value={room.squareFootage}
            onChange={(e) => updateField('squareFootage', Number(e.target.value))} />
        </Field>
        <Field label="Ceiling height (ft)">
          <Input type="number" step="0.5" value={room.ceilingHeight}
            onChange={(e) => updateField('ceilingHeight', Number(e.target.value))} />
        </Field>
        <Field label="Ceiling type">
          <Select value={room.ceilingType ?? 'flat'}
            onChange={(e) => updateField('ceilingType', e.target.value as 'flat' | 'vaulted' | 'cathedral')}>
            <option value="flat">Flat</option>
            <option value="vaulted">Vaulted</option>
            <option value="cathedral">Cathedral</option>
          </Select>
        </Field>
      </div>

      {/* Walls */}
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Walls</p>
        {room.walls.map((wall, i) => (
          <div key={i} className="grid grid-cols-7 gap-2 mb-2 items-end">
            <Field label={i === 0 ? 'Orient.' : ''}>
              <Select value={wall.orientation}
                onChange={(e) => updateWall(i, { orientation: e.target.value as RoomWallInput['orientation'] })}>
                {['N','NE','E','SE','S','SW','W','NW'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label={i === 0 ? 'Length (ft)' : ''}>
              <Input type="number" step="1" value={wall.length}
                onChange={(e) => updateWall(i, { length: Number(e.target.value) })} />
            </Field>
            <Field label={i === 0 ? 'R-value' : ''}>
              <Input type="number" step="0.5" value={wall.rValue}
                onChange={(e) => updateWall(i, { rValue: Number(e.target.value) })} />
            </Field>
            <Field label={i === 0 ? 'Mass' : ''}>
              <Select value={wall.mass}
                onChange={(e) => updateWall(i, { mass: e.target.value as 'light' | 'medium' | 'heavy' })}>
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="heavy">Heavy</option>
              </Select>
            </Field>
            <Field label={i === 0 ? 'Party wall?' : ''}>
              <Select value={wall.partyWall ? 'true' : 'false'}
                onChange={(e) => updateWall(i, { partyWall: e.target.value === 'true' })}>
                <option value="false">Exterior</option>
                <option value="true">Shared/party</option>
              </Select>
            </Field>
            <Field label={i === 0 ? 'Framing %' : ''}>
              <Input type="number" step="1" min="0" max="50" placeholder="23"
                value={wall.framingPct ? (wall.framingPct * 100).toFixed(0) : ''}
                onChange={(e) => updateWall(i, { framingPct: e.target.value ? Number(e.target.value) / 100 : undefined })} />
            </Field>
            <Button type="button" variant="danger" onClick={() => removeWall(i)}>
              ×
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={addWall}>+ Add wall</Button>
      </div>

      {/* Windows */}
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Windows</p>
        {room.windows.map((win, i) => (
          <div key={i} className="grid grid-cols-7 gap-2 mb-2 items-end">
            <Field label={i === 0 ? 'Orient.' : ''}>
              <Select value={win.orientation}
                onChange={(e) => updateWindow(i, { orientation: e.target.value as RoomWindowInput['orientation'] })}>
                {['N','NE','E','SE','S','SW','W','NW'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label={i === 0 ? 'Width (ft)' : ''}>
              <Input type="number" step="0.25" value={win.width}
                onChange={(e) => updateWindow(i, { width: Number(e.target.value) })} />
            </Field>
            <Field label={i === 0 ? 'Height (ft)' : ''}>
              <Input type="number" step="0.25" value={win.height}
                onChange={(e) => updateWindow(i, { height: Number(e.target.value) })} />
            </Field>
            <Field label={i === 0 ? 'U-value' : ''}>
              <Input type="number" step="0.01" value={win.uValue}
                onChange={(e) => updateWindow(i, { uValue: Number(e.target.value) })} />
            </Field>
            <Field label={i === 0 ? 'SHGC' : ''}>
              <Input type="number" step="0.01" value={win.shgc}
                onChange={(e) => updateWindow(i, { shgc: Number(e.target.value) })} />
            </Field>
            <Field label={i === 0 ? 'Overhang (ft)' : ''}>
              <Input type="number" step="0.25" min="0" value={win.overhangDepth ?? 0}
                onChange={(e) => updateWindow(i, { overhangDepth: Number(e.target.value) })} />
            </Field>
            <Button type="button" variant="danger" onClick={() => removeWindow(i)}>
              ×
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={addWindow}>+ Add window</Button>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="danger" onClick={onRemove}>
          Remove room
        </Button>
      </div>
    </Card>
  );
}
