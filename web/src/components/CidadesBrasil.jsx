// Atalhos pra tela inicial. Já vêm com as coordenadas, então não precisa buscar o nome na API.
export const CIDADES = [
  { nome: 'São Paulo', estado: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { nome: 'Rio de Janeiro', estado: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
  { nome: 'Brasília', estado: 'Distrito Federal', lat: -15.7939, lon: -47.8828 },
  { nome: 'Salvador', estado: 'Bahia', lat: -12.9714, lon: -38.5014 },
  { nome: 'Fortaleza', estado: 'Ceará', lat: -3.7319, lon: -38.5267 },
  { nome: 'Belo Horizonte', estado: 'Minas Gerais', lat: -19.9167, lon: -43.9345 },
  { nome: 'Manaus', estado: 'Amazonas', lat: -3.119, lon: -60.0217 },
  { nome: 'Curitiba', estado: 'Paraná', lat: -25.4284, lon: -49.2733 },
  { nome: 'Recife', estado: 'Pernambuco', lat: -8.0476, lon: -34.877 },
  { nome: 'Porto Alegre', estado: 'Rio Grande do Sul', lat: -30.0346, lon: -51.2177 },
  { nome: 'Belém', estado: 'Pará', lat: -1.4558, lon: -48.4902 },
  { nome: 'Florianópolis', estado: 'Santa Catarina', lat: -27.5954, lon: -48.548 },
];

export default function CidadesBrasil({ onEscolher }) {
  return (
    <section className="cidades-brasil">
      <h3>Principais cidades do Brasil</h3>
      <div className="cidades-grade">
        {CIDADES.map((c) => (
          <button key={c.nome} className="chip" onClick={() => onEscolher({ ...c, pais: 'BR' })}>
            {c.nome}
          </button>
        ))}
      </div>
    </section>
  );
}
