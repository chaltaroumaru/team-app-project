import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const SEED_ENTRIES = [
  {
    category: "DUEL",
    title: "クロスヘア(照準)は頭の高さで置いておく",
    content:
      "常に敵の頭が出てくる高さにクロスヘアを事前に合わせておく(プリエイム)。曲がり角や開けた場所に入る前に、味方の位置情報や過去の傾向から敵が出てきそうな地点を予測し、そこに照準を置いてから移動する。撃ち合いの勝率はエイムの反応速度よりもプリエイムの精度で決まることが多い。",
    tags: "エイム,プリエイム,クロスヘア配置,基礎",
  },
  {
    category: "ECONOMY",
    title: "1ラウンド目に負けた後のエコ判断の基本",
    content:
      "ピストルラウンドを落とした場合、2ラウンド目は基本的にセーブ(装備をほぼ買わずに温存)し、3ラウンド目でフル/フォースバイに回すのが基本方針。ただしチームの残クレジットが十分(3900以上目安)ならフォースバイでリスクを取る選択肢もある。エコ判断はチームで統一すること。",
    tags: "経済,エコ,セーブ,ピストル",
  },
  {
    category: "POSITIONING",
    title: "クロスファイアを意識したデュオポジション",
    content:
      "1人で通路に対して正面から待つのではなく、2人で角度をずらして構える(クロスファイア)ことで、敵が片方を意識している間にもう片方が撃てる状況を作る。守るサイトの主要な侵入経路に対して、常に2方向以上からケアできているかを意識する。",
    tags: "ポジショニング,クロスファイア,守り,基礎",
  },
  {
    category: "COMMUNICATION",
    title: "情報コールは「誰が」「どこで」「何を」の順で簡潔に",
    content:
      "「Aショート、1人見た、ジェット」のように、位置→人数→特徴(エージェントや武器)の順で短く伝える。長い説明は戦況の判断を遅らせるため、まず短いコールを出してから必要なら補足する。デスした場合は撃たれた方向と残り人数を必ず伝える。",
    tags: "コール,連携,基礎",
  },
  {
    category: "MENTAL",
    title: "連続デスした後こそプレーを単純化する",
    content:
      "連続でキルを取られると熱くなって無理な撃ち合いや単独プッシュをしがちになる。そういう時ほど無理をせず、味方と合わせる、情報を待つ、といった基本に立ち返る。1ラウンドの結果に感情を引きずらず、次のラウンドの最初の判断をいつも通りのルーティンで行うことを意識する。",
    tags: "メンタル,基礎",
  },
  {
    category: "UTILITY",
    title: "スモークはタイミングを揃えて味方と連携する",
    content:
      "エントリー前のスモークは、投げるタイミングが早すぎると効果が切れた瞬間に無防備な突入になり、遅すぎると味方の合わせが遅れる。基本は突入直前(1〜2秒前)に展開し始め、着弾と同時に味方が動き出せるよう事前に「せーの」で合わせる。",
    tags: "スキル,ユーティリティ,スモーク,連携,基礎",
  },
  {
    category: "GENERAL",
    title: "ラウンド開始直後はミニマップで敵の展開を予測する",
    content:
      "ラウンド開始直後の数秒間は、敵の初動(何人がどのサイトに寄っているか)をミニマップの足音・弾かれた情報などから予測することに使う。自分の役割(アタッカー/サイト固定/フレックス)に応じて、その予測をもとに立ち位置を微調整する。",
    tags: "基礎,ミニマップ,情報",
  },
] as const;

async function main() {
  const existingSeedCount = await prisma.knowledgeEntry.count({
    where: { source: "SEED" },
  });
  if (existingSeedCount > 0) {
    console.log(`Seed entries already present (${existingSeedCount}), skipping.`);
    return;
  }

  for (const entry of SEED_ENTRIES) {
    await prisma.knowledgeEntry.create({
      data: { ...entry, source: "SEED" },
    });
  }
  console.log(`Seeded ${SEED_ENTRIES.length} baseline knowledge entries.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
