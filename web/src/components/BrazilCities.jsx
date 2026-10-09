// Shortcuts for the home screen. They already come with the coordinates, so there's no need to look up the name.
export const CITIES = [
  { name: 'São Paulo', state: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro', state: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
  { name: 'Brasília', state: 'Federal District', lat: -15.7939, lon: -47.8828 },
  { name: 'Salvador', state: 'Bahia', lat: -12.9714, lon: -38.5014 },
  { name: 'Fortaleza', state: 'Ceará', lat: -3.7319, lon: -38.5267 },
  { name: 'Belo Horizonte', state: 'Minas Gerais', lat: -19.9167, lon: -43.9345 },
  { name: 'Manaus', state: 'Amazonas', lat: -3.119, lon: -60.0217 },
  { name: 'Curitiba', state: 'Paraná', lat: -25.4284, lon: -49.2733 },
  { name: 'Recife', state: 'Pernambuco', lat: -8.0476, lon: -34.877 },
  { name: 'Porto Alegre', state: 'Rio Grande do Sul', lat: -30.0346, lon: -51.2177 },
  { name: 'Belém', state: 'Pará', lat: -1.4558, lon: -48.4902 },
  { name: 'Florianópolis', state: 'Santa Catarina', lat: -27.5954, lon: -48.548 },
];

export default function BrazilCities({ onPick }) {
  return (
    <section className="brazil-cities">
      <h3>Major cities in Brazil</h3>
      <div className="city-grid">
        {CITIES.map((c) => (
          <button key={c.name} className="chip" onClick={() => onPick({ ...c, country: 'BR' })}>
            {c.name}
          </button>
        ))}
      </div>
    </section>
  );
}
