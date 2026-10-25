// Catálogo LOCAL de demonstração. Contém apenas dados estruturais de que há certeza
// (ano, gêneros, número de temporadas/episódios). Não há pôsteres: o app usa placeholders gerados.
// Títulos de episódios não listados aqui ficam desconhecidos (null) — nunca inventados.
export const SEED = [
  {
    id: 'seed:mentalist',
    title_original: 'The Mentalist',
    title_pt: 'O Mentalista',
    year: 2008,
    genres: ['Crime', 'Drama', 'Mistério'],
    overview:
      'Patrick Jane, ex-falso médium com um olhar excepcional para detalhes, passa a colaborar com uma unidade de investigação criminal da Califórnia.',
    status: 'Encerrada',
    seasons: [23, 23, 24, 24, 22, 22, 13],
    aliases: ['mentalist', 'o mentalista'],
    titles: { '1:1': 'Pilot' },
    popular: true,
  },
  {
    id: 'seed:breaking-bad',
    title_original: 'Breaking Bad',
    title_pt: 'Breaking Bad: A Química do Mal',
    year: 2008,
    genres: ['Crime', 'Drama', 'Thriller'],
    overview: 'Um professor de química diagnosticado com uma doença grave entra no mundo do crime para garantir o futuro da família.',
    status: 'Encerrada',
    seasons: [7, 13, 13, 13, 16],
    aliases: ['breaking bad', 'a quimica do mal'],
    titles: {},
    popular: true,
  },
  {
    id: 'seed:friends',
    title_original: 'Friends',
    title_pt: 'Friends',
    year: 1994,
    genres: ['Comédia', 'Romance'],
    overview: 'Seis amigos em Nova York dividem alegrias, trabalhos, amores e confusões do dia a dia.',
    status: 'Encerrada',
    seasons: [24, 24, 25, 24, 24, 25, 24, 24, 24, 18],
    aliases: ['friends'],
    titles: {},
    popular: true,
  },
  {
    id: 'seed:dark',
    title_original: 'Dark',
    title_pt: 'Dark',
    year: 2017,
    genres: ['Ficção científica', 'Mistério', 'Drama'],
    overview: 'O desaparecimento de crianças numa cidade alemã expõe segredos de quatro famílias ligados ao tempo.',
    status: 'Encerrada',
    seasons: [10, 8, 8],
    aliases: ['dark'],
    titles: {},
    popular: true,
  },
];

export const seedById = (id) => SEED.find((s) => s.id === id);
