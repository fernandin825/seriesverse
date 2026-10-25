import { norm } from './util.js';

// Relatórios curados offline. Só entram aqui fatos amplamente conhecidos e estruturais do episódio.
// Detalhes do caso policial do piloto NÃO são descritos porque não foram verificados — o relatório
// declara essa limitação em vez de inventar acontecimentos.
const MENTALIST_PILOT = {
  limited: true,
  limitation_note:
    'Relatório limitado: usa apenas elementos estruturais do episódio piloto (premissa, personagens apresentados e abordagem de investigação). Os detalhes do caso específico não foram verificados offline e, por isso, não são descritos. Cole sua chave do Gemini (gratuita) em Ajustes ou registre sua própria descrição do episódio para uma análise mais completa.',
  summary: [
    {
      heading: 'Como o episódio apresenta a série',
      text: 'O piloto apresenta Patrick Jane, consultor sem formação policial que trabalha com a equipe de investigação criminal chefiada por Teresa Lisbon (Cho, Rigsby e Van Pelt completam o time). Jane é conhecido por notar pequenos detalhes de aparência e comportamento e, a partir deles, levantar hipóteses sobre pessoas e situações.',
    },
    {
      heading: 'O passado de Jane',
      text: 'O episódio estabelece que Jane teve, no passado, uma carreira de falso médium na televisão e que um assassino chamado Red John está ligado à perda de sua família. Esse passado é a motivação que acompanha o personagem.',
    },
    {
      heading: 'Atrito entre métodos',
      text: 'O estilo pouco convencional de Jane contrasta com o trabalho de procedimento da equipe. A convivência entre intuição observadora e rotina investigativa é um dos eixos do episódio.',
    },
  ],
  events_note: 'Elementos estruturais do episódio — a ordem cronológica das cenas não foi verificada.',
  events: [
    { what: 'Apresentação do método de observação de Jane', why: 'Define como a série trata investigação: por leitura de detalhes e hipóteses, não por poderes.', consequence: 'A equipe passa a contar com o olhar dele, ainda que com desconfiança.', observe: 'Repare quando o personagem descreve o que viu e quando ele apenas supõe.' },
    { what: 'Revelação do passado de Jane como falso médium e da ligação com Red John', why: 'Explica por que ele aceita trabalhar com a polícia.', consequence: 'Cria a motivação pessoal que sustenta a série.', observe: 'Note como o passado influencia o modo como ele lida com as pessoas.' },
    { what: 'Convivência entre Jane e a equipe de Lisbon', why: 'Mostra a tensão entre métodos informais e procedimentos.', consequence: 'Estabelece a dinâmica de trabalho dos episódios seguintes sem antecipá-los.', observe: 'Observe como cada pessoa da equipe contribui de forma diferente.' },
  ],
  characters: [
    {
      name: 'Patrick Jane',
      decision: 'Usar observação de detalhes para orientar a investigação, em vez de depender só de procedimento.',
      motivation_hypothesis: 'Hipótese: ele quer provar que atenção a detalhes pode ser útil sem recorrer à farsa de seu passado.',
      shown: 'Ele descreve conclusões baseadas em detalhes que diz ter notado.',
      interpretation: 'Interpretação possível: observar bem não garante estar certo — a hipótese ainda precisa ser confirmada.',
    },
    {
      name: 'Teresa Lisbon e equipe',
      decision: 'Aceitar a colaboração de Jane sem abrir mão do trabalho formal de investigação.',
      motivation_hypothesis: 'Hipótese: buscam resultados sem comprometer o processo.',
      shown: 'A equipe segue procedimentos enquanto lida com as iniciativas de Jane.',
      interpretation: 'Interpretação possível: o contraste entre eles reforça a importância de verificar hipóteses.',
    },
  ],
  clues: [
    { item: 'Detalhes de comportamento e aparência', how_helps: 'Servem de ponto de partida para perguntas e hipóteses — não de prova. A confirmação depende de evidências.' },
  ],
  lessons: [
    {
      lesson: 'Separar observação de interpretação',
      episode_link: 'Jane parte do que percebe (observação) para formular o que supõe (hipótese).',
      real_life: {
        situation: 'Um colega responde de forma curta durante uma reunião.',
        action: 'Anote três coisas que você realmente observou e, em separado, três hipóteses possíveis para elas.',
        caution: 'Uma observação isolada raramente prova algo sobre outra pessoa; pergunte antes de concluir.',
      },
    },
    {
      lesson: 'Hipóteses precisam de confirmação',
      episode_link: 'O trabalho de procedimento da equipe complementa a intuição de Jane.',
      real_life: {
        situation: 'Você acha que um amigo ficou chateado com algo que você disse.',
        action: 'Em vez de afirmar, faça uma pergunta aberta e gentil, como “Como você está se sentindo sobre aquela conversa?”.',
        caution: 'Use a observação para entender e cuidar das pessoas, nunca para pressionar, manipular ou invadir a privacidade de alguém.',
      },
    },
  ],
  genre_insight: {
    label: 'Série policial',
    text: 'Em séries de investigação, o piloto costuma definir o “método” da história. Aqui, o método é observar, levantar hipóteses e checar. Lembre-se: na TV o raciocínio dá certo com mais frequência do que na vida real, onde evidências e verificação pesam muito mais.',
  },
  quiz: [
    {
      id: 'q1', type: 'mc',
      prompt: 'Qual é a base do método de Patrick Jane apresentada no episódio?',
      options: ['Poderes sobrenaturais genuínos', 'Observação de detalhes e formulação de hipóteses', 'Confissões obtidas sob pressão', 'Sorte e coincidência'],
      answer: 1,
      explanation: 'O personagem trabalha a partir de detalhes de aparência e comportamento que percebe e das hipóteses que formula; a série não apresenta isso como poder sobrenatural.',
      hint: 'Pense no que ele “lê” nas pessoas.',
    },
    {
      id: 'q2', type: 'tf',
      prompt: 'Verdadeiro ou falso: na premissa da série, Jane já usou a fachada de médium, mas seu método de trabalho se baseia em observação, não em poderes reais.',
      answer: true,
      explanation: 'É verdadeiro: o passado como falso médium faz parte do personagem, e o método mostrado é de observação atenta.',
      hint: 'Releia o relatório sobre o passado de Jane.',
    },
    {
      id: 'q3', type: 'apply',
      prompt: 'Dê um exemplo do seu cotidiano que mostre a diferença entre observação e interpretação.',
      criteria: [
        { label: 'apontou algo que foi realmente observado', keywords: ['observ', 'vi ', 'vejo', 'notei', 'percebi', 'fato', 'comportamento', 'silencio', 'quieto', 'ouvi'] },
        { label: 'apontou uma suposição ou hipótese separada do que foi observado', keywords: ['hipotese', 'suposi', 'suponho', 'acho que', 'talvez', 'interpret', 'conclus', 'pode estar', 'imagin'] },
      ],
      model_answer: 'Exemplo: “Vi que meu colega ficou em silêncio na reunião (observação). Suponho que esteja chateado, mas pode estar apenas cansado (hipótese).”',
      explanation: 'Uma boa resposta separa o que foi visto ou ouvido do que foi suposto — e reconhece que a suposição ainda precisa ser checada.',
      hint: 'Use duas frases: uma com o que você viu, outra com o que você acha.',
    },
  ],
  challenge: {
    text: 'Durante o dia, observe uma situação cotidiana (um som, um gesto, um lugar). Anote o que você realmente viu ou ouviu e, separadamente, o que está apenas supondo.',
    safety_note: 'Não precisa envolver ninguém diretamente, não custa nada e deve respeitar a privacidade das pessoas.',
  },
};

export function curatedFor(series, season, episode) {
  const t = norm(series.title_original);
  if (t === 'the mentalist' && season === 1 && episode === 1) return structuredClone(MENTALIST_PILOT);
  return null;
}
