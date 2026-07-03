import { PLANETS } from '../planets.js';

export default function PlanetSelect({ view, selectedPlanet, onChange }) {
  const value = view === 'system' ? 'system' : selectedPlanet;

  function handleChange(e) {
    const v = e.target.value;
    if (v === 'system') {
      onChange({ view: 'system' });
    } else {
      onChange({ view: 'detail', planet: v });
    }
  }

  return (
    <select className="planet-select" value={value} onChange={handleChange} aria-label="Choose view">
      <option value="system">🌌 Solar System</option>
      {PLANETS.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
