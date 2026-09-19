import {NextResponse} from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

type Village = {
  id: number;
  x: number;
  y: number;
  tribe: number;
  villageId: number;
  name: string;
  playerId: number;
  player: string;
  allianceId: number;
  alliance: string;
  pop: number;
};

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asString(value: unknown) {
  return value == null ? '' : String(value);
}

function normalizeVillage(value: Record<string, unknown>): Village {
  return {
    id: asNumber(value.id ?? value.villageId),
    x: asNumber(value.x),
    y: asNumber(value.y),
    tribe: asNumber(value.tribe),
    villageId: asNumber(value.villageId ?? value.id),
    name: asString(value.name ?? value.village),
    playerId: asNumber(value.playerId),
    player: asString(value.player ?? value.playerName),
    allianceId: asNumber(value.allianceId),
    alliance: asString(value.alliance ?? value.allianceName),
    pop: asNumber(value.pop ?? value.population),
  };
}

async function readVillages(): Promise<Village[]> {
  // The generated snapshot is kept at the repository root. The second path
  // keeps the endpoint compatible with older map update jobs.
  const locations = [
    path.join(process.cwd(), 'villages.json'),
    path.join(process.cwd(), 'data', 'villages.json'),
  ];

  let lastError: unknown;
  for (const location of locations) {
    try {
      const contents = await fs.readFile(location, 'utf8');
      const parsed: unknown = JSON.parse(contents);
      if (!Array.isArray(parsed)) throw new Error('Village snapshot is not an array');
      return parsed
        .filter((v): v is Record<string, unknown> => !!v && typeof v === 'object')
        .map(normalizeVillage);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Village snapshot not found');
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';

  if (!query) return NextResponse.json({ villages: [] });

  try {
    const villages = await readVillages();
    const normalizedQuery = query.toLocaleLowerCase('sv-SE');
    const coordinate = query.match(/^\s*(-?\d+)\s*[|,; ]\s*(-?\d+)\s*$/);

    const matches = coordinate
      ? villages.filter((v) => v.x === Number(coordinate[1]) && v.y === Number(coordinate[2]))
      : villages.filter((v) => {
          const haystack = [
            v.name,
            v.player,
            v.alliance,
            `${v.x}|${v.y}`,
            `${v.x},${v.y}`,
            String(v.villageId),
          ].join(' ').toLocaleLowerCase('sv-SE');
          return haystack.includes(normalizedQuery);
        });

    return NextResponse.json(
      { villages: matches.slice(0, 25) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Unable to search villages', error);
    return NextResponse.json(
      { villages: [], error: 'Village data is temporarily unavailable' },
      { status: 500 },
    );
  }
}
