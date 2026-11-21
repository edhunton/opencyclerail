import { describe, it, expect } from 'vitest';
import { legBikePolicy, trainBikePolicy, setExtraRules } from '../src/index';

// One case per kind of rule, each the answer the operator's page gave on
// 21 Nov 2026 (data/bike-policy-sources.json).
describe('line rules', () => {
  it('TGV inOui books a space', () => expect(trainBikePolicy('TGV INOUI 6609', 'SNCF Voyageurs')).toBe('reservation'));
  it('Ouigo Train Classique books a paid space; Ouigo Grande Vitesse is bagged only', () => {
    expect(trainBikePolicy('OUIGO_TC 54', 'SNCF Voyageurs')).toBe('reservation');
    expect(trainBikePolicy('OUIGO 7641', 'SNCF Voyageurs')).toBe('disassembled');
  });
  it('the Brussels ICE 3 sets take no built bike', () => expect(trainBikePolicy('ICE 12', 'DB Fernverkehr')).toBe('disassembled'));
  it('Renfe Alvia is bagged only, Renfe MD rolls on', () => {
    expect(trainBikePolicy('ALVIA 04073', 'Renfe')).toBe('disassembled');
    expect(trainBikePolicy('MD 18021', 'Renfe')).toBe('assembled');
  });
  it('a train nobody has placed is unknown, not fine', () => expect(trainBikePolicy('XYZ 1', 'Some Railway')).toBe('unknown'));
});

describe('route rules', () => {
  const es = (from: string, to: string) => legBikePolicy({ line: 'EST 9114', agency: 'Eurostar', from, to });
  it('Eurostar by route', () => {
    expect(es('London St Pancras', 'Bruxelles-Midi')).toBe('reservation');
    expect(es('London St Pancras', 'Amsterdam Centraal')).toBe('reservation');
    expect(es('London St Pancras', 'Paris-Nord')).toBe('disassembled');
    expect(es('London St Pancras', 'Lille Europe')).toBe('none');
    expect(es('London St Pancras', 'Rotterdam Centraal')).toBe('none');
  });
  it('Vy books on the Bergen line only', () => {
    expect(legBikePolicy({ line: 'F4', agency: 'Vy', from: 'Oslo S', to: 'Bergen' })).toBe('reservation');
    expect(legBikePolicy({ line: 'R', agency: 'Vy', from: 'Oslo S', to: 'Halden' })).toBe('assembled');
  });
});

describe('country rule', () => {
  it('a train with both ends in Great Britain books a space', () =>
    expect(legBikePolicy({ line: 'Avanti West Coast', agency: 'Avanti West Coast', from: 'London Euston', to: 'Glasgow Central', fromLat: 51.528, fromLng: -0.134, toLat: 55.86, toLng: -4.258 })).toBe('reservation'));
});

describe('extra rules', () => {
  it('fill in only what the code calls unknown', () => {
    setExtraRules([{ pattern: '\\bvr\\b', policy: 'reservation' }, { pattern: 'tgv', policy: 'none' }]);
    expect(trainBikePolicy('IC 27', 'VR')).toBe('reservation');
    expect(trainBikePolicy('TGV INOUI 6609', 'SNCF Voyageurs')).toBe('reservation');
    setExtraRules([]);
  });
});
