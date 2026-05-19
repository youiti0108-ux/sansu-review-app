export const grades = [
  {
    id: 1,
    label: "1年生",
    units: ["たし算", "ひき算", "文章題の基礎", "時計", "かたち", "長さくらべ"]
  },
  {
    id: 2,
    label: "2年生",
    units: ["九九", "2けたのたし算", "2けたのひき算", "筆算", "かけ算の文章題", "時計と時間", "長さ", "かさ", "図形"]
  },
  {
    id: 3,
    label: "3年生",
    units: ["わり算", "あまりのあるわり算", "かけ算の筆算", "わり算の文章題", "時こくと時間", "長さ", "重さ", "円と球", "表とグラフ"]
  }
];

export const unitDescriptions = {
  たし算: "ぜんぶでいくつか、たしかめます。",
  ひき算: "のこりがいくつか、たしかめます。",
  文章題の基礎: "みじかい おはなしをよんで、しきとこたえをえらびます。",
  時計: "とけいの はりをみて、なんじかをえらびます。",
  かたち: "まる、さんかく、しかくをみつけます。",
  長さくらべ: "ながい・みじかい、たかい・ひくいをくらべます。",
  九九: "近い答えに気をつけながら、2のだんから9のだんまで練習します。",
  "2けたのたし算": "くり上がりに気をつけて、2けたのたし算をします。",
  "2けたのひき算": "くり下がりに気をつけて、2けたのひき算をします。",
  筆算: "たし算とひき算の筆算を穴うめで進めます。",
  かけ算の文章題: "同じ数が何こ分あるかを考えます。",
  時計と時間: "何時何分か、かんたんな時間を考えます。",
  長さ: "cmとmの関係や長さのくらべ方をたしかめます。",
  かさ: "L、dL、mLの関係をたしかめます。",
  図形: "三角形、四角形、直角のある形を見分けます。",
  わり算: "同じ数ずつ分ける考え方をたしかめます。",
  あまりのあるわり算: "あまりがわる数より小さいことをたしかめます。",
  かけ算の筆算: "一の位、くり上がり、十の位を順に考えます。",
  わり算の文章題: "文章からわり算の式と答えを順に選びます。",
  時こくと時間: "何分後、何分前、かかった時間を考えます。",
  重さ: "gとkgの関係や重さの感覚をたしかめます。",
  円と球: "円の中心、半径、直径や球の形を学びます。",
  表とグラフ: "表や棒グラフから分かることを読み取ります。"
};

const q = (data) => ({
  difficulty: "ふつう",
  rubyQuestion: data.question,
  rubyExplanation: data.explanation,
  steps: [],
  ...data
});

const isNonNegativeChoice = (value) => {
  const number = Number(value);
  return (Number.isNaN(number) || number >= 0) && !/^\s*-\d/.test(String(value));
};

const choiceValue = (choice) => (choice && typeof choice === "object" ? choice.label : choice);
const isValidChoice = (choice) => {
  const value = choiceValue(choice);
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  if (!text || text === "NaN" || text === "undefined" || text === "null") return false;
  return isNonNegativeChoice(text);
};

const uniqueChoices = (choices) => choices.filter((choice, index, array) => (
  isValidChoice(choice) && array.findIndex((item) => String(choiceValue(item)) === String(choiceValue(choice))) === index
));

const ensureFourChoices = (answer, choices) => {
  const answerText = String(answer);
  const values = uniqueChoices([answerText, ...choices]);
  const answerIndex = values.findIndex((choice) => String(choiceValue(choice)) === answerText);
  if (answerIndex > 0) [values[0], values[answerIndex]] = [values[answerIndex], values[0]];
  if (answerIndex === -1) values.unshift(answerText);

  const numeric = Number(answer);
  if (Number.isFinite(numeric)) {
    [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 10, -10, 20, -20].forEach((offset) => {
      const candidate = numeric + offset;
      const text = String(candidate);
      if (values.length < 4 && candidate >= 0 && !values.some((choice) => String(choiceValue(choice)) === text)) {
        values.push(text);
      }
    });
    let candidate = 0;
    while (values.length < 4 && candidate <= numeric + 30) {
      const text = String(candidate);
      if (!values.some((choice) => String(choiceValue(choice)) === text)) values.push(text);
      candidate += 1;
    }
  }

  return values.slice(0, 4);
};

const choiceSet = (answer, misses) => {
  return ensureFourChoices(answer, [answer, ...misses].map(String));
};

const calcMisses = ({ grade, op, a, b, answer }) => {
  if (grade === 1 && (op === "+" || op === "-")) return [answer - 1, answer + 1, answer - 2, answer + 2];
  if (op === "+") return [answer - 10, answer + 1, answer + 10];
  if (op === "-") return [answer + 10, answer - 1, answer + 2];
  if (op === "×") return [a * (b - 1), a * (b + 1), answer + b, answer - a];
  return [answer - 1, answer + 1, b];
};

const calcExplanation = ({ grade, op, a, b, answer }) => {
  if (grade === 1 && op === "+") return `${a}に${b}をたすと、${answer}です。`;
  if (grade === 1 && op === "-") return `${a}から${b}をひくと、${answer}のこります。`;
  if (op === "+") return `一の位からじゅんにたすと、答えは${answer}です。`;
  if (op === "-") return `一の位からじゅんにひくと、答えは${answer}です。`;
  if (op === "×") return `${a}が${b}つ分なので、答えは${answer}です。`;
  return `${b}のだんで${a}をこえない数を見つけると、答えは${answer}です。`;
};

const quickCalcs = [
  [1, "たし算", "g1-add", [[3, 4], [6, 5], [8, 7], [9, 3], [5, 6], [7, 8], [4, 9], [6, 6], [2, 9], [8, 5]], "+"],
  [1, "ひき算", "g1-sub", [[9, 4], [12, 5], [15, 7], [11, 3], [14, 8], [10, 6], [13, 4], [16, 9], [18, 8], [17, 9]], "-"],
  [2, "九九", "g2-kuku", [[2, 7], [3, 8], [4, 6], [5, 9], [6, 7], [7, 8], [8, 9], [9, 6], [3, 9], [4, 8]], "×"],
  [2, "2けたのたし算", "g2-add2", [[27, 36], [48, 25], [56, 17], [39, 44], [68, 23], [35, 28], [47, 19], [59, 32], [26, 57], [74, 18]], "+"],
  [2, "2けたのひき算", "g2-sub2", [[52, 28], [64, 37], [81, 46], [73, 25], [90, 54], [62, 19], [75, 38], [43, 27], [86, 49], [51, 16]], "-"],
  [3, "わり算", "g3-div", [[24, 6], [32, 8], [45, 9], [28, 7], [36, 4], [18, 3], [42, 6], [56, 7], [63, 9], [48, 8]], "÷"]
];

const generatedQuick = quickCalcs.flatMap(([grade, unit, prefix, pairs, op]) =>
  pairs.map(([a, b], index) => {
    const answer = op === "+" ? a + b : op === "-" ? a - b : op === "×" ? a * b : a / b;
    const misses = calcMisses({ grade, op, a, b, answer });
    return q({
      id: `${prefix}-${index + 1}`,
      grade,
      unit,
      modeType: "quick",
      questionType: "calculation",
      question: `${a} ${op} ${b} = ?`,
      choices: choiceSet(answer, misses.filter((n) => n > 0)),
      answer: String(answer),
      explanation: calcExplanation({ grade, op, a, b, answer })
    });
  })
);

const gradeUnit = (grade, index) => grades.find((item) => item.id === grade)?.units[index];
const range = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => start + index);

const makeCalcChoices = (answer, misses) => {
  return ensureFourChoices(answer, [answer, ...misses].map(String));
};

const makeRemainderChoices = (quotient, remainder, divisor) => {
  const answer = `${quotient} あまり ${remainder}`;
  const candidates = [
    answer,
    `${quotient + 1} あまり ${Math.max(0, remainder - divisor)}`,
    `${Math.max(1, quotient - 1)} あまり ${remainder + divisor}`,
    `${quotient} あまり ${Math.max(0, remainder - 1)}`,
    `${quotient + 1} あまり ${remainder}`
  ];
  return uniqueChoices(candidates).slice(0, 4);
};

const buildGeneratedCalcs = ({ prefix, grade, unit, op, pairs }) => pairs.map(([a, b], index) => {
  const answer = op === "+" ? a + b : op === "-" ? a - b : op === "×" ? a * b : a / b;
  const misses =
    op === "+"
      ? [answer - 10, answer - 1, answer + 1, answer + 10]
      : op === "-"
        ? [answer + 10, answer - 1, answer + 2, Math.abs(b - Number(String(a).at(-1) || 0))]
        : op === "×"
          ? [a * Math.max(1, b - 1), a * Math.min(9, b + 1), answer + a, answer - b]
          : [answer - 1, answer + 1, b, Math.max(1, a - b)];
  const explanation =
    op === "+"
      ? `${a} に ${b} をたすと ${answer} です。`
      : op === "-"
        ? `${a} から ${b} をひくと ${answer} です。`
        : op === "×"
          ? `${a} が ${b} こ分で ${answer} です。`
          : `${b} のだんで ${a} になる数を考えると ${answer} です。`;
  return q({
    id: `${prefix}-${a}-${b}`,
    grade,
    unit,
    modeType: "quick",
    questionType: "calculation",
    question: `${a} ${op} ${b} = ?`,
    choices: makeCalcChoices(answer, misses),
    answer: String(answer),
    explanation
  });
});

const generatedBaseCalcs = [
  ...buildGeneratedCalcs({
    prefix: "g1-add-auto",
    grade: 1,
    unit: gradeUnit(1, 0),
    op: "+",
    pairs: range(1, 10).flatMap((a) => range(1, 10).map((b) => [a, b]).filter(([x, y]) => x + y <= 20))
  }),
  ...buildGeneratedCalcs({
    prefix: "g1-sub-auto",
    grade: 1,
    unit: gradeUnit(1, 1),
    op: "-",
    pairs: range(2, 20).flatMap((a) => range(1, Math.min(10, a)).map((b) => [a, b]))
  }),
  ...buildGeneratedCalcs({
    prefix: "g2-kuku-auto",
    grade: 2,
    unit: gradeUnit(2, 0),
    op: "×",
    pairs: range(1, 9).flatMap((a) => range(1, 9).map((b) => [a, b]))
  }),
  ...buildGeneratedCalcs({
    prefix: "g2-add2-auto",
    grade: 2,
    unit: gradeUnit(2, 1),
    op: "+",
    pairs: range(10, 89)
      .flatMap((a) => range(10, 89).map((b) => [a, b]))
      .filter(([a, b]) => a + b < 100 && ((a * 3 + b) % 17 === 0 || (a % 10) + (b % 10) >= 10))
      .slice(0, 240)
  }),
  ...buildGeneratedCalcs({
    prefix: "g2-sub2-auto",
    grade: 2,
    unit: gradeUnit(2, 2),
    op: "-",
    pairs: range(20, 99)
      .flatMap((a) => range(10, Math.min(89, a - 1)).map((b) => [a, b]))
      .filter(([a, b]) => a - b > 0 && ((a * 5 + b) % 19 === 0 || (a % 10) < (b % 10)))
      .slice(0, 240)
  }),
  ...buildGeneratedCalcs({
    prefix: "g3-div-auto",
    grade: 3,
    unit: gradeUnit(3, 0),
    op: "÷",
    pairs: range(2, 9).flatMap((divisor) => range(1, 9).map((quotient) => [divisor * quotient, divisor]))
  }),
  ...buildGeneratedCalcs({
    prefix: "g3-mul-vertical-auto",
    grade: 3,
    unit: gradeUnit(3, 2),
    op: "×",
    pairs: [
      ...range(12, 99).flatMap((a) => range(2, 9).map((b) => [a, b])).filter(([a, b]) => (a + b) % 4 === 0),
      ...range(102, 199).flatMap((a) => range(2, 6).map((b) => [a, b])).filter(([a, b]) => (a + b) % 9 === 0)
    ].slice(0, 220)
  }),
  ...range(2, 9).flatMap((divisor) =>
    range(1, 9).flatMap((quotient) =>
      range(1, divisor - 1).map((remainder) => {
        const dividend = divisor * quotient + remainder;
        return q({
          id: `g3-remain-auto-${divisor}-${quotient}-${remainder}`,
          grade: 3,
          unit: gradeUnit(3, 1),
          modeType: "quick",
          questionType: "calculation",
          question: `${dividend} ÷ ${divisor} = ?`,
          choices: makeRemainderChoices(quotient, remainder, divisor),
          answer: `${quotient} あまり ${remainder}`,
          explanation: `${divisor} × ${quotient} = ${divisor * quotient} で、${dividend} をこえません。あまりは ${remainder} です。`
        });
      })
    )
  )
];

const word = ({ id, grade, unit, question, answer, explanation, steps }) => q({
  id, grade, unit, modeType: "step", questionType: "word", question, answer, explanation, choices: steps.at(-1).choices, steps
});

const wordSteps = [
  word({
    id: "g1-add-word-1", grade: 1, unit: "文章題の基礎",
    question: "あめが 5こ あります。あとから 3こ もらいました。ぜんぶで なんこ ありますか？",
    answer: "8こ", explanation: "ふえたので、たしざんです。5 + 3 = 8 です。",
    steps: [
      { label: "しきをえらぼう", prompt: "どのしきになるかな？", choices: ["5 + 3", "5 - 3", "5 × 3", "5 ÷ 3"], answer: "5 + 3", explanation: "あとからもらってふえたので、たしざんです。" },
      { label: "こたえをえらぼう", prompt: "5 + 3 は いくつ？", choices: ["7こ", "8こ", "9こ", "10こ"], answer: "8こ", explanation: "5に3をたすと8です。" }
    ]
  }),
  word({
    id: "g1-add-word-2", grade: 1, unit: "文章題の基礎",
    question: "はなが 7ほん あります。2ほん もらいました。ぜんぶで なんほんですか？",
    answer: "9ほん", explanation: "もらってふえたので、7 + 2 です。",
    steps: [
      { label: "しきをえらぼう", prompt: "どのしきになるかな？", choices: ["7 + 2", "7 - 2", "2 - 7", "7 × 2"], answer: "7 + 2", explanation: "もらってふえたので、たしざんです。" },
      { label: "こたえをえらぼう", prompt: "7 + 2 は いくつ？", choices: ["5ほん", "8ほん", "9ほん", "10ほん"], answer: "9ほん", explanation: "7に2をたすと9です。" }
    ]
  }),
  word({
    id: "g1-add-word-3", grade: 1, unit: "文章題の基礎",
    question: "りんごが 6こ あります。4こ もらいました。ぜんぶで なんこ ですか？",
    answer: "10こ", explanation: "ふえたので、たしざんです。6 + 4 = 10 です。",
    steps: [
      { label: "しきをえらぼう", prompt: "どのしきになるかな？", choices: ["6 + 4", "6 - 4", "4 - 6", "6 × 4"], answer: "6 + 4", explanation: "もらってふえたので、たしざんです。" },
      { label: "こたえをえらぼう", prompt: "6 + 4 は いくつ？", choices: ["9こ", "10こ", "11こ", "2こ"], answer: "10こ", explanation: "6に4をたすと10です。" }
    ]
  }),
  word({
    id: "g1-sub-word-1", grade: 1, unit: "文章題の基礎",
    question: "えんぴつが 12ほん あります。5ほん つかいました。のこりは なんほんですか？",
    answer: "7ほん", explanation: "つかったので、ひきざんです。12 - 5 = 7 です。",
    steps: [
      { label: "しきをえらぼう", prompt: "どのしきになるかな？", choices: ["12 + 5", "12 - 5", "5 - 12", "12 × 5"], answer: "12 - 5", explanation: "つかったぶんだけへるので、ひきざんです。" },
      { label: "こたえをえらぼう", prompt: "12 - 5 は いくつ？", choices: ["6ほん", "7ほん", "8ほん", "17ほん"], answer: "7ほん", explanation: "12から5をひくと7です。" }
    ]
  }),
  word({
    id: "g1-sub-word-2", grade: 1, unit: "文章題の基礎",
    question: "みかんが 10こ あります。4こ たべました。のこりは なんこですか？",
    answer: "6こ", explanation: "たべてへったので、10 - 4 です。",
    steps: [
      { label: "しきをえらぼう", prompt: "どのしきになるかな？", choices: ["10 + 4", "10 - 4", "4 - 10", "10 ÷ 4"], answer: "10 - 4", explanation: "たべたぶんだけへるので、ひきざんです。" },
      { label: "こたえをえらぼう", prompt: "10 - 4 は いくつ？", choices: ["5こ", "6こ", "7こ", "14こ"], answer: "6こ", explanation: "10から4をひくと6です。" }
    ]
  }),
  word({
    id: "g2-mul-word-1", grade: 2, unit: "かけ算の文章題",
    question: "1さら に りんごが 4こ あります。同じさらが 6さら あります。りんごは ぜんぶで なんこ ありますか？",
    answer: "24こ", explanation: "同じ数がいくつ分あるかを考えるので、かけ算を使います。4 × 6 = 24です。",
    steps: [
      { label: "式をえらぼう", prompt: "どの式になるかな？", choices: ["4 + 6", "6 - 4", "4 × 6", "6 ÷ 4"], answer: "4 × 6", explanation: "4こが6さら分なので、かけ算です。" },
      { label: "答えをえらぼう", prompt: "4 × 6 の答えは？", choices: ["20こ", "22こ", "24こ", "28こ"], answer: "24こ", explanation: "4 × 6 = 24です。" }
    ]
  }),
  word({
    id: "g2-mul-word-2", grade: 2, unit: "かけ算の文章題",
    question: "1ふくろに クッキーが 7こ 入っています。3ふくろでは なんこですか？",
    answer: "21こ", explanation: "7こが3ふくろ分なので、7 × 3 = 21です。",
    steps: [
      { label: "式をえらぼう", prompt: "どの式になるかな？", choices: ["7 + 3", "7 - 3", "7 × 3", "7 ÷ 3"], answer: "7 × 3", explanation: "同じ数が3つ分あるので、かけ算です。" },
      { label: "答えをえらぼう", prompt: "7 × 3 の答えは？", choices: ["18こ", "20こ", "21こ", "24こ"], answer: "21こ", explanation: "7 × 3 = 21です。" }
    ]
  }),
  word({
    id: "g2-mul-word-3", grade: 2, unit: "かけ算の文章題",
    question: "1れつに 8人ずつ ならんでいます。5れつでは なん人ですか？",
    answer: "40人", explanation: "8人ずつが5れつ分なので、8 × 5 = 40です。",
    steps: [
      { label: "式をえらぼう", prompt: "どの式になるかな？", choices: ["8 + 5", "8 × 5", "8 - 5", "8 ÷ 5"], answer: "8 × 5", explanation: "8人ずつが5れつなので、かけ算です。" },
      { label: "答えをえらぼう", prompt: "8 × 5 の答えは？", choices: ["35人", "40人", "45人", "13人"], answer: "40人", explanation: "8 × 5 = 40です。" }
    ]
  }),
  word({
    id: "g2-mul-word-4", grade: 2, unit: "かけ算の文章題",
    question: "1はこに チョコが 6こ あります。同じはこが 4はこ あります。チョコは ぜんぶで なんこ ですか？",
    answer: "24こ", explanation: "6こが4はこ分あります。6 × 4 = 24です。",
    steps: [
      { label: "式をえらぼう", prompt: "どの式になるかな？", choices: ["6 + 4", "6 - 4", "6 × 4", "6 ÷ 4"], answer: "6 × 4", explanation: "同じ数が4つ分あるので、かけ算です。" },
      { label: "答えをえらぼう", prompt: "6 × 4 の答えは？", choices: ["20こ", "22こ", "24こ", "28こ"], answer: "24こ", explanation: "6 × 4 = 24です。" }
    ]
  }),
  word({
    id: "g2-mul-word-5", grade: 2, unit: "かけ算の文章題",
    question: "1まいのカードに シールが 9こ あります。カードが 3まい あります。シールは ぜんぶで なんこ ですか？",
    answer: "27こ", explanation: "9こが3まい分あります。9 × 3 = 27です。",
    steps: [
      { label: "式をえらぼう", prompt: "どの式になるかな？", choices: ["9 + 3", "9 - 3", "9 × 3", "9 ÷ 3"], answer: "9 × 3", explanation: "同じ数が3つ分あるので、かけ算です。" },
      { label: "答えをえらぼう", prompt: "9 × 3 の答えは？", choices: ["24こ", "27こ", "30こ", "12こ"], answer: "27こ", explanation: "9 × 3 = 27です。" }
    ]
  }),
  word({
    id: "g3-div-word-1", grade: 3, unit: "わり算の文章題",
    question: "りんごが 24こ あります。6人で同じ数ずつ分けます。1人分は何こですか？",
    answer: "4こ", explanation: "同じ数ずつ分けるので、24 ÷ 6 です。",
    steps: [
      { label: "式をえらぼう", prompt: "どの式になるかな？", choices: ["24 + 6", "24 - 6", "24 × 6", "24 ÷ 6"], answer: "24 ÷ 6", explanation: "同じ数ずつ分けるので、わり算です。" },
      { label: "答えをえらぼう", prompt: "24 ÷ 6 の答えは？", choices: ["3こ", "4こ", "5こ", "6こ"], answer: "4こ", explanation: "24を6人で分けると、1人分は4こです。" }
    ]
  }),
  word({
    id: "g3-div-word-2", grade: 3, unit: "わり算の文章題",
    question: "色紙が 36まい あります。4人で同じ数ずつ分けます。1人分は何まいですか？",
    answer: "9まい", explanation: "36 ÷ 4 = 9です。",
    steps: [
      { label: "式をえらぼう", prompt: "どの式になるかな？", choices: ["36 + 4", "36 - 4", "36 × 4", "36 ÷ 4"], answer: "36 ÷ 4", explanation: "同じ数ずつ分けるので、わり算です。" },
      { label: "答えをえらぼう", prompt: "36 ÷ 4 の答えは？", choices: ["8まい", "9まい", "10まい", "32まい"], answer: "9まい", explanation: "四九36なので、答えは9です。" }
    ]
  }),
  word({
    id: "g3-div-word-3", grade: 3, unit: "わり算の文章題",
    question: "えんぴつが 42本 あります。7本ずつたばにします。何たばできますか？",
    answer: "6たば", explanation: "42 ÷ 7 = 6です。",
    steps: [
      { label: "式をえらぼう", prompt: "どの式になるかな？", choices: ["42 + 7", "42 - 7", "42 × 7", "42 ÷ 7"], answer: "42 ÷ 7", explanation: "7本ずつに分けるので、わり算です。" },
      { label: "答えをえらぼう", prompt: "42 ÷ 7 の答えは？", choices: ["5たば", "6たば", "7たば", "8たば"], answer: "6たば", explanation: "七六42なので、6たばです。" }
    ]
  }),
  word({
    id: "g3-div-word-4", grade: 3, unit: "わり算の文章題",
    question: "シールが 32まい あります。8人で同じ数ずつ分けます。1人分は何まいですか？",
    answer: "4まい", explanation: "同じ数ずつ分けるので、32 ÷ 8 です。",
    steps: [
      { label: "式をえらぼう", prompt: "どの式になるかな？", choices: ["32 + 8", "32 - 8", "32 × 8", "32 ÷ 8"], answer: "32 ÷ 8", explanation: "8人で同じ数ずつ分けるので、わり算です。" },
      { label: "答えをえらぼう", prompt: "32 ÷ 8 の答えは？", choices: ["3まい", "4まい", "5まい", "8まい"], answer: "4まい", explanation: "8 × 4 = 32 なので、1人分は4まいです。" }
    ]
  }),
  word({
    id: "g3-div-word-5", grade: 3, unit: "わり算の文章題",
    question: "カードが 45まい あります。9まいずつ ふくろに入れます。何ふくろできますか？",
    answer: "5ふくろ", explanation: "9まいずつ入れるので、45 ÷ 9 です。",
    steps: [
      { label: "式をえらぼう", prompt: "どの式になるかな？", choices: ["45 + 9", "45 - 9", "45 × 9", "45 ÷ 9"], answer: "45 ÷ 9", explanation: "同じ数ずつ入れるので、わり算です。" },
      { label: "答えをえらぼう", prompt: "45 ÷ 9 の答えは？", choices: ["4ふくろ", "5ふくろ", "6ふくろ", "36ふくろ"], answer: "5ふくろ", explanation: "9 × 5 = 45 なので、5ふくろできます。" }
    ]
  })
];

const remainders = [
  [23, 5, "4ふくろ あまり3こ"], [29, 6, "4ふくろ あまり5こ"], [34, 8, "4ふくろ あまり2こ"], [37, 6, "6ふくろ あまり1こ"], [46, 9, "5ふくろ あまり1こ"]
].map(([total, size, answer], index) => {
  const quotient = Math.floor(total / size);
  const product = quotient * size;
  return word({
    id: `g3-remain-word-${index + 1}`, grade: 3, unit: "あまりのあるわり算",
    question: `クッキーが ${total}こ あります。1ふくろに ${size}こずつ 入れます。何ふくろできて、何こあまりますか？`,
    answer, explanation: `${size} × ${quotient} = ${product} で、${total}をこえません。${total} - ${product} = ${total - product} です。`,
    steps: [
      { label: "式をえらぼう", prompt: "どの式になるかな？", choices: [`${total} + ${size}`, `${total} - ${size}`, `${total} × ${size}`, `${total} ÷ ${size}`], answer: `${total} ÷ ${size}`, explanation: "同じ数ずつ入れるので、わり算です。" },
      { label: "とちゅうを考えよう", prompt: `${total} ÷ ${size} は、${size} × 何 が${total}に近いかな？`, choices: [`${size} × ${quotient - 1} = ${size * (quotient - 1)}`, `${size} × ${quotient} = ${product}`, `${size} × ${quotient + 1} = ${size * (quotient + 1)}`, `${size} × ${quotient + 2} = ${size * (quotient + 2)}`], answer: `${size} × ${quotient} = ${product}`, explanation: `${total}をこえない中で、${product}がいちばん近いです。` },
      { label: "答えをえらぼう", prompt: "答えはどれ？", choices: [answer, `${quotient + 1}ふくろ あまり${size - (total - product)}こ`, `${quotient - 1}ふくろ あまり${total - size * (quotient - 1)}こ`, `${quotient}ふくろ あまり${Math.max(0, total - product - 1)}こ`], answer, explanation: `${total} - ${product} = ${total - product} なので、答えは ${answer} です。` }
    ]
  });
});

const verticalQuestion = ({ id, grade, unit, top, op, bottom, answer, steps }) => q({
  id, grade, unit, modeType: "step", questionType: "vertical",
  question: `${top} ${op} ${bottom} を筆算で考えよう。`,
  choices: steps.at(-1).choices,
  answer: String(answer),
  explanation: steps.at(-1).explanation,
  layout: { top, op, bottom, answer },
  steps
});

const addVertical = (id, top, bottom, answer) => {
  const onesSum = Number(top[1]) + Number(bottom[1]);
  const carry = Math.floor(onesSum / 10);
  const ones = onesSum % 10;
  const tens = Number(top[0]) + Number(bottom[0]) + carry;
  return verticalQuestion({
    id, grade: 2, unit: "筆算", top, op: "+", bottom, answer,
    steps: [
      { label: "一の位", prompt: `${top[1]} + ${bottom[1]} = ?`, choices: choiceSet(onesSum, [ones, onesSum - 1, onesSum + 1]), answer: String(onesSum), explanation: `一の位は ${onesSum} です。`, fill: {} },
      { label: "一の位を書く", prompt: "一の位に書く数字は？", choices: choiceSet(ones, [carry, onesSum, Number(bottom[1])]), answer: String(ones), explanation: `${onesSum}の一の位は${ones}です。`, fill: { ones: String(ones) } },
      { label: "くり上がり", prompt: "くり上がる数は？", choices: ["0", "1", "5", "10"], answer: String(carry), explanation: `${onesSum}なので、${carry}くり上がります。`, fill: { carry: String(carry), ones: String(ones) } },
      { label: "十の位", prompt: `十の位は？ ${top[0]} + ${bottom[0]} + ${carry} = ?`, choices: choiceSet(tens, [tens - 1, tens + 1, tens + 2]), answer: String(tens), explanation: `十の位は${tens}です。`, fill: { carry: String(carry), tens: String(tens), ones: String(ones) } },
      { label: "答え", prompt: `${top} + ${bottom} = ?`, choices: choiceSet(answer, [answer - 10, answer + 1, answer + 10]), answer: String(answer), explanation: `答えは${answer}です。`, fill: { carry: String(carry), tens: String(tens), ones: String(ones) } }
    ]
  });
};

const subVertical = (id, top, bottom, answer) => verticalQuestion({
  id, grade: 2, unit: "筆算", top, op: "-", bottom, answer,
  steps: [
    { label: "ひけるかな", prompt: `${top[1]}から${bottom[1]}はひける？`, choices: ["ひける", "ひけない", "たせる", "同じ"], answer: "ひけない", explanation: "一の位はそのままではひけません。", fill: {} },
    { label: "くり下がり", prompt: "ひけないときはどうする？", choices: ["十の位から1くり下げる", "そのままひく", "答えを0にする", "たし算にする"], answer: "十の位から1くり下げる", explanation: "十の位から1くり下げて考えます。", fill: { borrow: String(Number(top[0]) - 1), borrowedOnes: String(Number(top[1]) + 10) } },
    { label: "一の位", prompt: `${Number(top[1]) + 10} - ${bottom[1]} = ?`, choices: choiceSet((Number(top[1]) + 10) - Number(bottom[1]), [2, 3, 5]), answer: String((Number(top[1]) + 10) - Number(bottom[1])), explanation: "くり下げたので、一の位を計算します。", fill: { borrow: String(Number(top[0]) - 1), borrowedOnes: String(Number(top[1]) + 10), ones: String(answer % 10) } },
    { label: "十の位", prompt: "十の位はどうなる？", choices: [`${Number(top[0]) - 1} - ${bottom[0]}`, `${top[0]} - ${bottom[0]}`, `${top[0]} - ${bottom[1]}`, `${Number(top[0]) - 1} + ${bottom[0]}`], answer: `${Number(top[0]) - 1} - ${bottom[0]}`, explanation: "十の位は1くり下げた数で計算します。", fill: { borrow: String(Number(top[0]) - 1), borrowedOnes: String(Number(top[1]) + 10), ones: String(answer % 10) } },
    { label: "答え", prompt: `${top} - ${bottom} = ?`, choices: choiceSet(answer, [answer + 10, answer + 2, answer - 10]), answer: String(answer), explanation: `答えは${answer}です。`, fill: { borrow: String(Number(top[0]) - 1), borrowedOnes: String(Number(top[1]) + 10), tens: String(Math.floor(answer / 10)), ones: String(answer % 10) } }
  ]
});

const mulVertical = (id, top, bottom, answer) => {
  const onesProduct = Number(bottom) * Number(top[1]);
  const carry = Math.floor(onesProduct / 10);
  const ones = onesProduct % 10;
  const tens = Number(bottom) * Number(top[0]) + carry;
  return verticalQuestion({
    id, grade: 3, unit: "かけ算の筆算", top, op: "×", bottom, answer,
    steps: [
      { label: "一の位", prompt: `${bottom} × ${top[1]} = ?`, choices: choiceSet(onesProduct, [onesProduct - 2, onesProduct + 2, ones]), answer: String(onesProduct), explanation: "一の位からかけます。", fill: {} },
      { label: "一の位を書く", prompt: "一の位に書く数字は？", choices: choiceSet(ones, [carry, onesProduct, Number(top[1])]), answer: String(ones), explanation: `${onesProduct}の一の位は${ones}です。`, fill: { ones: String(ones) } },
      { label: "くり上がり", prompt: "くり上がる数は？", choices: choiceSet(carry, [0, 1, 2, 3]), answer: String(carry), explanation: `${onesProduct}なので、${carry}くり上がります。`, fill: { carry: String(carry), ones: String(ones) } },
      { label: "十の位", prompt: `${bottom} × ${top[0]} + ${carry} = ?`, choices: choiceSet(tens, [tens - 1, tens + 1, tens + 3]), answer: String(tens), explanation: `十の位は${tens}です。`, fill: { carry: String(carry), tens: String(tens), ones: String(ones) } },
      { label: "答え", prompt: `${top} × ${bottom} = ?`, choices: choiceSet(answer, [answer - 10, answer + 4, answer + 10]), answer: String(answer), explanation: `答えは${answer}です。`, fill: { carry: String(carry), tens: String(tens), ones: String(ones) } }
    ]
  });
};

const verticals = [
  addVertical("g2-vertical-add-1", "28", "47", 75),
  addVertical("g2-vertical-add-2", "36", "28", 64),
  addVertical("g2-vertical-add-3", "57", "26", 83),
  subVertical("g2-vertical-sub-1", "52", "28", 24),
  subVertical("g2-vertical-sub-2", "63", "37", 26),
  subVertical("g2-vertical-sub-3", "81", "46", 35),
  mulVertical("g3-vertical-mul-1", "23", "4", 92),
  mulVertical("g3-vertical-mul-2", "34", "3", 102),
  mulVertical("g3-vertical-mul-3", "42", "6", 252),
  mulVertical("g3-vertical-mul-4", "56", "7", 392),
  mulVertical("g3-vertical-mul-5", "45", "6", 270)
];

const remainderQuick = [
  [23, 5, "4 あまり3", ["5 あまり2", "3 あまり8", "4 あまり2"]],
  [34, 6, "5 あまり4", ["6 あまり2", "4 あまり10", "5 あまり3"]],
  [17, 5, "3 あまり2", ["2 あまり7", "4 あまり2", "3 あまり1"]],
  [26, 4, "6 あまり2", ["5 あまり6", "6 あまり1", "7 あまり2"]],
  [31, 6, "5 あまり1", ["4 あまり7", "5 あまり0", "6 あまり1"]],
  [22, 7, "3 あまり1", ["2 あまり8", "3 あまり0", "4 あまり1"]],
  [38, 9, "4 あまり2", ["3 あまり11", "4 あまり1", "5 あまり2"]]
].map(([a, b, answer, misses], index) => q({
  id: `g3-remain-quick-${index + 1}`,
  grade: 3,
  unit: "あまりのあるわり算",
  modeType: "quick",
  questionType: "calculation",
  question: `${a} ÷ ${b} = ?`,
  choices: choiceSet(answer, misses),
  answer,
  explanation: `${b}のだんで${a}をこえない数を見つけると、答えは${answer}です。`
}));

const quick = (data) => q({ modeType: "quick", ...data });

const clockQuestions = [
  quick({ id: "g1-clock-1", grade: 1, unit: "時計", questionType: "clock", question: "このとけいは なんじ ですか？", clock: { hour: 3, minute: 0 }, choices: ["2じ", "3じ", "4じ", "5じ"], answer: "3じ", explanation: "みじかい はりが3をさしています。だから3じです。" }),
  quick({ id: "g1-clock-2", grade: 1, unit: "時計", questionType: "clock", question: "このとけいは なんじ ですか？", clock: { hour: 8, minute: 0 }, choices: ["7じ", "8じ", "9じ", "10じ"], answer: "8じ", explanation: "みじかい はりが8をさしています。だから8じです。" }),
  quick({ id: "g1-clock-3", grade: 1, unit: "時計", questionType: "clock", question: "このとけいは なんじ ですか？", clock: { hour: 11, minute: 0 }, choices: ["10じ", "11じ", "12じ", "1じ"], answer: "11じ", explanation: "みじかい はりが11をさしています。だから11じです。" }),
  quick({ id: "g2-clock-1", grade: 2, unit: "時計と時間", questionType: "clock", question: "この時計は何時何分ですか？", clock: { hour: 2, minute: 30 }, choices: ["2時30分", "3時30分", "2時6分", "6時10分"], answer: "2時30分", explanation: "長い針が6を指すと30分です。" }),
  quick({ id: "g2-clock-2", grade: 2, unit: "時計と時間", questionType: "clock", question: "この時計は何時何分ですか？", clock: { hour: 7, minute: 15 }, choices: ["7時15分", "7時3分", "8時15分", "3時35分"], answer: "7時15分", explanation: "長い針が3を指すと15分です。" }),
  quick({ id: "g2-clock-3", grade: 2, unit: "時計と時間", questionType: "clock", question: "この時計は何時何分ですか？", clock: { hour: 10, minute: 45 }, choices: ["10時45分", "9時45分", "10時9分", "11時15分"], answer: "10時45分", explanation: "長い針が9を指すと45分です。" }),
  quick({ id: "g2-clock-4", grade: 2, unit: "時計と時間", questionType: "clock", question: "1時20分の30分後は何時何分ですか？", clock: { hour: 1, minute: 20 }, choices: ["1時50分", "1時30分", "2時20分", "12時50分"], answer: "1時50分", explanation: "20分に30分をたすと50分です。だから1時50分です。" }),
  quick({ id: "g2-clock-5", grade: 2, unit: "時計と時間", questionType: "clock", question: "4時15分の15分後は何時何分ですか？", clock: { hour: 4, minute: 15 }, choices: ["4時30分", "4時15分", "5時15分", "4時45分"], answer: "4時30分", explanation: "15分に15分をたすと30分です。だから4時30分です。" }),
  quick({ id: "g3-time-1", grade: 3, unit: "時こくと時間", questionType: "clock", question: "2時35分の40分後は何時何分ですか？", clock: { hour: 2, minute: 35 }, choices: ["3時15分", "3時05分", "2時75分", "4時15分"], answer: "3時15分", explanation: "35分に40分をたすと75分。60分で1時間なので、3時15分です。" }),
  quick({ id: "g3-time-2", grade: 3, unit: "時こくと時間", questionType: "clock", question: "9時50分の25分後は何時何分ですか？", clock: { hour: 9, minute: 50 }, choices: ["10時15分", "9時75分", "10時05分", "11時15分"], answer: "10時15分", explanation: "50分に25分をたすと75分。1時間15分なので10時15分です。" }),
  quick({ id: "g3-time-3", grade: 3, unit: "時こくと時間", questionType: "clock", question: "4時20分の30分前は何時何分ですか？", clock: { hour: 4, minute: 20 }, choices: ["3時50分", "4時50分", "3時40分", "4時10分"], answer: "3時50分", explanation: "20分から30分はひけないので、1時間もどして3時50分です。" }),
  quick({ id: "g3-time-4", grade: 3, unit: "時こくと時間", questionType: "clock", question: "9時20分から9時55分までは何分ですか？", clock: { hour: 9, minute: 20 }, choices: ["25分", "35分", "45分", "55分"], answer: "35分", explanation: "20分から55分までは、55 - 20 = 35分です。" })
];

const digitalClockQuestions = [
  quick({ id: "g1-clock-digital-1", grade: 1, unit: gradeUnit(1, 3), questionType: "clock", question: "この とけいと おなじ じこくは どれですか？", clock: { hour: 3, minute: 0 }, choices: ["03:00", "04:00", "03:30", "12:15"], answer: "03:00", explanation: "みじかい はりが3、ながい はりが12なので 03:00 です。" }),
  quick({ id: "g1-clock-digital-2", grade: 1, unit: gradeUnit(1, 3), questionType: "clock", question: "この とけいと おなじ じこくは どれですか？", clock: { hour: 7, minute: 0 }, choices: ["07:00", "06:00", "07:30", "12:07"], answer: "07:00", explanation: "みじかい はりが7、ながい はりが12なので 07:00 です。" }),
  quick({ id: "g1-clock-digital-3", grade: 1, unit: gradeUnit(1, 3), questionType: "clock", question: "この とけいと おなじ じこくは どれですか？", clock: { hour: 9, minute: 0 }, choices: ["09:00", "08:00", "09:30", "12:09"], answer: "09:00", explanation: "みじかい はりが9、ながい はりが12なので 09:00 です。" }),
  quick({ id: "g1-clock-digital-4", grade: 1, unit: gradeUnit(1, 3), questionType: "clock", question: "この とけいと おなじ じこくは どれですか？", clock: { hour: 12, minute: 0 }, choices: ["12:00", "01:00", "12:30", "06:00"], answer: "12:00", explanation: "みじかい はりも、ながい はりも12をさすので 12:00 です。" }),
  quick({ id: "g2-clock-digital-1", grade: 2, unit: gradeUnit(2, 5), questionType: "clock", question: "この時計と同じ時こくはどれですか？", clock: { hour: 3, minute: 30 }, choices: ["03:30", "02:30", "03:06", "06:15"], answer: "03:30", explanation: "長いはりが6をさすと30分です。3時30分は 03:30 です。" }),
  quick({ id: "g2-clock-digital-2", grade: 2, unit: gradeUnit(2, 5), questionType: "clock", question: "この時計と同じ時こくはどれですか？", clock: { hour: 7, minute: 15 }, choices: ["07:15", "07:03", "08:15", "03:35"], answer: "07:15", explanation: "長いはりが3をさすと15分です。7時15分は 07:15 です。" }),
  quick({ id: "g2-clock-digital-3", grade: 2, unit: gradeUnit(2, 5), questionType: "clock", question: "この時計と同じ時こくはどれですか？", clock: { hour: 2, minute: 45 }, choices: ["02:45", "03:45", "02:09", "09:10"], answer: "02:45", explanation: "長いはりが9をさすと45分です。2時45分は 02:45 です。" }),
  quick({ id: "g3-time-digital-1", grade: 3, unit: gradeUnit(3, 4), questionType: "clock", question: "2時35分の40分後はどれですか？", clock: { hour: 2, minute: 35 }, choices: ["03:15", "03:05", "02:75", "04:15"], answer: "03:15", explanation: "35分に40分をたすと75分です。60分で1時間なので、3時15分です。" }),
  quick({ id: "g3-time-digital-2", grade: 3, unit: gradeUnit(3, 4), questionType: "clock", question: "14:05 は、何時何分ですか？", clock: { hour: 14, minute: 5 }, choices: ["午後2時5分", "午前2時5分", "午後4時5分", "午後2時50分"], answer: "午後2時5分", explanation: "14時は午後2時です。05分なので、午後2時5分です。" })
];

const unitQuestions = [
  quick({ id: "g1-length-1", grade: 1, unit: "長さくらべ", questionType: "unit", question: "えんぴつAは 8cm、えんぴつBは 12cm です。ながいのは どちらですか？", choices: ["えんぴつA", "えんぴつB", "おなじ", "わからない"], answer: "えんぴつB", explanation: "12cmは8cmよりながいです。" }),
  quick({ id: "g1-length-2", grade: 1, unit: "長さくらべ", questionType: "unit", question: "あかいひもは 6cm、あおいひもは 6cm です。どちらが ながいですか？", choices: ["あかいひも", "あおいひも", "おなじ", "どちらもみじかい"], answer: "おなじ", explanation: "どちらも6cmです。おなじながさです。" }),
  quick({ id: "g1-length-3", grade: 1, unit: "長さくらべ", questionType: "unit", question: "つみきAは 10cm、つみきBは 7cm です。たかいのは どちらですか？", choices: ["つみきA", "つみきB", "おなじ", "どちらもひくい"], answer: "つみきA", explanation: "10cmは7cmよりたかいです。" }),
  quick({ id: "g2-length-1", grade: 2, unit: "長さ", questionType: "unit", question: "1m は 何cm ですか？", choices: ["10cm", "100cm", "1000cm", "1cm"], answer: "100cm", explanation: "1m = 100cm です。" }),
  quick({ id: "g2-length-2", grade: 2, unit: "長さ", questionType: "unit", question: "150cm は 何m何cm ですか？", choices: ["1m50cm", "15m", "1m5cm", "150m"], answer: "1m50cm", explanation: "100cmで1m、のこり50cmです。" }),
  quick({ id: "g2-length-3", grade: 2, unit: "長さ", questionType: "unit", question: "2m は 何cm ですか？", choices: ["20cm", "200cm", "100cm", "2000cm"], answer: "200cm", explanation: "1mは100cmなので、2mは200cmです。" }),
  quick({ id: "g2-length-4", grade: 2, unit: "長さ", questionType: "unit", question: "この中で一番長いのはどれですか？", choices: ["90cm", "1m", "80cm", "50cm"], answer: "1m", explanation: "1mは100cmです。90cmより長いです。" }),
  quick({ id: "g2-capacity-1", grade: 2, unit: "かさ", questionType: "unit", question: "1L は 何dL ですか？", choices: ["1dL", "10dL", "100dL", "1000dL"], answer: "10dL", explanation: "1L = 10dL です。" }),
  quick({ id: "g2-capacity-2", grade: 2, unit: "かさ", questionType: "unit", question: "1L は 何mL ですか？", choices: ["10mL", "100mL", "1000mL", "10000mL"], answer: "1000mL", explanation: "1L = 1000mL です。" }),
  quick({ id: "g2-capacity-3", grade: 2, unit: "かさ", questionType: "unit", question: "この中で一番多いかさはどれですか？", choices: ["8dL", "1L", "900mL", "500mL"], answer: "1L", explanation: "1Lは1000mLなので、この中で一番多いです。" }),
  quick({ id: "g2-capacity-4", grade: 2, unit: "かさ", questionType: "unit", question: "500mL と 1L では、どちらが多いですか？", choices: ["500mL", "1L", "同じ", "くらべられない"], answer: "1L", explanation: "1Lは1000mLです。500mLより多いです。" }),
  quick({ id: "g3-km-1", grade: 3, unit: "長さ", questionType: "unit", question: "1km は 何m ですか？", choices: ["10m", "100m", "1000m", "10000m"], answer: "1000m", explanation: "1km = 1000m です。" }),
  quick({ id: "g3-km-2", grade: 3, unit: "長さ", questionType: "unit", question: "2km は 何m ですか？", choices: ["200m", "2000m", "20m", "1200m"], answer: "2000m", explanation: "1kmは1000mなので、2kmは2000mです。" }),
  quick({ id: "g3-km-3", grade: 3, unit: "長さ", questionType: "unit", question: "1500m は 何km何m ですか？", choices: ["1km500m", "15km", "1km50m", "150km"], answer: "1km500m", explanation: "1000mで1km、のこり500mなので、1km500mです。" }),
  quick({ id: "g3-km-4", grade: 3, unit: "長さ", questionType: "unit", question: "この中で一番長いのはどれですか？", choices: ["900m", "1km", "800m", "500m"], answer: "1km", explanation: "1kmは1000mなので、900mより長いです。" }),
  quick({ id: "g3-weight-1", grade: 3, unit: "重さ", questionType: "unit", question: "1kg は 何g ですか？", choices: ["10g", "100g", "1000g", "10000g"], answer: "1000g", explanation: "1kg = 1000g です。" }),
  quick({ id: "g3-weight-2", grade: 3, unit: "重さ", questionType: "unit", question: "この中で一番重いのはどれですか？", choices: ["900g", "1kg", "800g", "500g"], answer: "1kg", explanation: "1kgは1000gなので、900gより重いです。" }),
  quick({ id: "g3-weight-3", grade: 3, unit: "重さ", questionType: "unit", question: "1500g は 何kg何g ですか？", choices: ["1kg500g", "15kg", "1kg50g", "150kg"], answer: "1kg500g", explanation: "1000gで1kg、のこり500gです。" }),
  quick({ id: "g3-weight-4", grade: 3, unit: "重さ", questionType: "unit", question: "2kg は 何g ですか？", choices: ["200g", "2000g", "20g", "1200g"], answer: "2000g", explanation: "1kgは1000gなので、2kgは2000gです。" })
];

const shapeQuestions = [
  quick({ id: "g1-shape-1", grade: 1, unit: "かたち", questionType: "shape", question: "さんかくは どれですか？", choices: [{ label: "まる", shape: "circle" }, { label: "さんかく", shape: "triangle" }, { label: "しかく", shape: "square" }, { label: "ながしかく", shape: "rectangle" }], answer: "さんかく", explanation: "さんかくは、3つのまっすぐなせんでできたかたちです。" }),
  quick({ id: "g1-shape-2", grade: 1, unit: "かたち", questionType: "shape", question: "まるは どれですか？", choices: [{ label: "さんかく", shape: "triangle" }, { label: "まる", shape: "circle" }, { label: "しかく", shape: "square" }, { label: "ながしかく", shape: "rectangle" }], answer: "まる", explanation: "まるは、かどがなくてぐるっとしたかたちです。" }),
  quick({ id: "g1-shape-3", grade: 1, unit: "かたち", questionType: "shape", question: "しかくは どれですか？", choices: [{ label: "まる", shape: "circle" }, { label: "さんかく", shape: "triangle" }, { label: "しかく", shape: "square" }, { label: "ほし", shape: "star" }], answer: "しかく", explanation: "しかくは、4つのまっすぐなせんでできたかたちです。" }),
  quick({ id: "g2-shape-1", grade: 2, unit: "図形", questionType: "shape", question: "四角形はどれですか？", choices: [{ label: "まる", shape: "circle" }, { label: "三角形", shape: "triangle" }, { label: "四角形", shape: "rectangle" }, { label: "線", shape: "line" }], answer: "四角形", explanation: "4本の直線でかこまれた形が四角形です。" }),
  quick({ id: "g2-shape-2", grade: 2, unit: "図形", questionType: "shape", question: "直角がある形はどれですか？", choices: [{ label: "まる", shape: "circle" }, { label: "直角三角形", shape: "rightTriangle" }, { label: "ななめ線", shape: "line" }, { label: "円", shape: "circle" }], answer: "直角三角形", explanation: "直角三角形には、直角のかどがあります。" }),
  quick({ id: "g2-shape-3", grade: 2, unit: "図形", questionType: "shape", question: "正方形はどれですか？", choices: [{ label: "正方形", shape: "square" }, { label: "長方形", shape: "rectangle" }, { label: "三角形", shape: "triangle" }, { label: "円", shape: "circle" }], answer: "正方形", explanation: "4つの辺の長さが同じ四角形が正方形です。" }),
  quick({ id: "g2-shape-4", grade: 2, unit: "図形", questionType: "shape", question: "辺が3つある形はどれですか？", choices: [{ label: "三角形", shape: "triangle" }, { label: "四角形", shape: "rectangle" }, { label: "円", shape: "circle" }, { label: "線", shape: "line" }], answer: "三角形", explanation: "三角形は、3つの辺でできた形です。" }),
  quick({ id: "g3-circle-1", grade: 3, unit: "円と球", questionType: "shape", question: "円のまん中の点を何といいますか？", shape: "circleCenter", choices: ["中心", "半径", "直径", "角"], answer: "中心", explanation: "円のまん中の点を中心といいます。" }),
  quick({ id: "g3-circle-2", grade: 3, unit: "円と球", questionType: "shape", question: "円の中心から円のまわりまでの長さを何といいますか？", shape: "circleRadius", choices: ["半径", "直径", "辺", "角"], answer: "半径", explanation: "中心から円のまわりまでの長さを半径といいます。" }),
  quick({ id: "g3-circle-3", grade: 3, unit: "円と球", questionType: "shape", question: "ボールのように、どこから見ても丸く見える形を何といいますか？", shape: "sphere", choices: ["球", "円", "三角形", "四角形"], answer: "球", explanation: "ボールのような立体の形を球といいます。" }),
  quick({ id: "g3-circle-4", grade: 3, unit: "円と球", questionType: "shape", question: "円のはしからはしまで、中心を通る線を何といいますか？", shape: "circleRadius", choices: ["直径", "半径", "中心", "角"], answer: "直径", explanation: "中心を通って、円のはしからはしまで引いた線を直径といいます。" })
];

const graphQuestions = [
  quick({ id: "g3-graph-1", grade: 3, unit: "表とグラフ", questionType: "graph", question: "すきなくだものを調べました。一番多いのはどれですか？", graph: { title: "すきなくだもの", rows: [["りんご", 5], ["みかん", 8], ["バナナ", 3]] }, choices: ["りんご", "みかん", "バナナ", "同じ"], answer: "みかん", explanation: "みかんは8人で、一番多いです。" }),
  quick({ id: "g3-graph-2", grade: 3, unit: "表とグラフ", questionType: "graph", question: "一番少ないのはどれですか？", graph: { title: "すきな遊び", rows: [["なわとび", 6], ["サッカー", 9], ["読書", 4]] }, choices: ["なわとび", "サッカー", "読書", "同じ"], answer: "読書", explanation: "読書は4人で、一番少ないです。" }),
  quick({ id: "g3-graph-3", grade: 3, unit: "表とグラフ", questionType: "graph", question: "犬とねこは、合わせて何人ですか？", graph: { title: "すきな動物", rows: [["犬", 7], ["ねこ", 6], ["うさぎ", 4]] }, choices: ["11人", "12人", "13人", "17人"], answer: "13人", explanation: "犬7人とねこ6人を合わせると13人です。" }),
  quick({ id: "g3-graph-4", grade: 3, unit: "表とグラフ", questionType: "graph", question: "みかんは、バナナより何人多いですか？", graph: { title: "すきなくだもの", rows: [["りんご", 5], ["みかん", 8], ["バナナ", 3]] }, choices: ["3人", "4人", "5人", "6人"], answer: "5人", explanation: "みかん8人からバナナ3人をひくと、5人多いです。" })
];

export function validateQuestion(question) {
  const issues = [];
  if (!question?.id) issues.push("idがありません");
  if (![1, 2, 3].includes(question?.grade)) issues.push("gradeが1〜3ではありません");
  if (!question?.unit) issues.push("unitがありません");
  if (!question?.modeType) issues.push("modeTypeがありません");
  if (!question?.questionType) issues.push("questionTypeがありません");
  if (!question?.question) issues.push("questionがありません");
  if (!question?.explanation) issues.push("explanationがありません");
  validateChoiceList(question?.choices, question?.answer, "choices", issues);
  if (Array.isArray(question?.steps)) {
    question.steps.forEach((step, index) => {
      if (!step?.prompt) issues.push(`steps[${index}]のpromptがありません`);
      if (!step?.explanation) issues.push(`steps[${index}]のexplanationがありません`);
      validateChoiceList(step?.choices, step?.answer, `steps[${index}].choices`, issues);
    });
  }
  return issues;
}

function validateChoiceList(choices, answer, label, issues) {
  if (!Array.isArray(choices)) {
    issues.push(`${label}が配列ではありません`);
    return;
  }
  const values = choices.map((choice) => String(choiceValue(choice)));
  if (choices.length !== 4) issues.push(`${label}が4択ではありません`);
  if (!values.includes(String(answer))) issues.push(`${label}にanswerが含まれていません`);
  if (new Set(values).size !== values.length) issues.push(`${label}に重複があります`);
  if (choices.some((choice) => !isValidChoice(choice))) issues.push(`${label}に不正な値があります`);
}

const allQuestions = [
  ...generatedQuick,
  ...generatedBaseCalcs,
  ...wordSteps,
  ...remainders,
  ...verticals,
  ...remainderQuick,
  ...clockQuestions,
  ...digitalClockQuestions,
  ...unitQuestions,
  ...shapeQuestions,
  ...graphQuestions
];

if (import.meta.env?.DEV) {
  allQuestions.forEach((question) => {
    const issues = validateQuestion(question);
    if (issues.length) console.warn(`[question validation] ${question.id || "unknown"}`, issues);
  });
}

export const questions = allQuestions;
