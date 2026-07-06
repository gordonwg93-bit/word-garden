# -*- coding: utf-8 -*-
"""One-time content expansion. Appends new words to existing per-letter JSON
files (keeps existing entries/ids untouched), fixes one emoji clash
(old -> uses a fresh emoji so 'grandpa' can use the original one), then
rewrites index.json counts."""
import json, os, glob, collections

DIR = "data/words"

ADDITIONS = {
"a": [("alarm","闹钟","nàozhōng","⏰","noun","The alarm rings in the morning.","闹钟早上响了。"),
      ("ape","猿","yuán","🦍","noun","The ape climbs the tree.","猿爬树。"),
      ("author","作家","zuòjiā","✍️","noun","The author writes a story.","作家写故事。"),
      ("afraid","害怕","hàipà","😨","adjective","I feel afraid of the dark.","我害怕黑暗。"),
      ("animal","动物","dòngwù","🐾","noun","I love every animal.","我喜欢每一种动物。"),
      ("ambulance","救护车","jiùhùchē","🚑","noun","The ambulance drives fast.","救护车开得很快。")],
"b": [("beach","海滩","hǎitān","🏖️","noun","We play at the beach.","我们在海滩玩。"),
      ("bed","床","chuáng","🛌","noun","I sleep in my bed.","我睡在我的床上。"),
      ("brush","牙刷","yáshuā","🪥","noun","I brush with my toothbrush.","我用牙刷刷牙。"),
      ("basket","篮子","lánzi","🧺","noun","I put fruit in the basket.","我把水果放进篮子里。"),
      ("bubble","泡泡","pàopào","🫧","noun","I blow a bubble.","我吹一个泡泡。")],
"c": [("castle","城堡","chéngbǎo","🏰","noun","The princess lives in a castle.","公主住在城堡里。"),
      ("coconut","椰子","yēzi","🥥","noun","I drink coconut water.","我喝椰子水。"),
      ("cute","可爱","kě'ài","🥰","adjective","The puppy is so cute.","小狗真可爱。"),
      ("cactus","仙人掌","xiānrénzhǎng","🌵","noun","The cactus lives in the desert.","仙人掌生活在沙漠里。"),
      ("camera","相机","xiàngjī","📷","noun","I take a photo with my camera.","我用相机拍照。")],
"d": [("dolphin","海豚","hǎitún","🐬","noun","The dolphin jumps out of the water.","海豚跳出水面。"),
      ("daisy","雏菊","chújú","🌼","noun","The daisy is white and yellow.","雏菊是白色和黄色的。"),
      ("dress","裙子","qúnzi","👗","noun","She wears a pretty dress.","她穿着漂亮的裙子。"),
      ("dad","爸爸","bàba","👨","noun","My dad reads to me.","我爸爸给我读书。"),
      ("dust","灰尘","huīchén","🌫️","noun","There is dust on the shelf.","架子上有灰尘。")],
"e": [("eight","八","bā","8️⃣","noun","I count to eight.","我数到八。"),
      ("empty","空的","kōng de","📭","adjective","The box is empty.","盒子是空的。"),
      ("envelope","信封","xìnfēng","✉️","noun","I put the letter in an envelope.","我把信放进信封。"),
      ("excited","兴奋","xīngfèn","🤩","adjective","I am excited for my birthday.","我为我的生日感到兴奋。"),
      ("exercise","运动","yùndòng","🏋️","verb","We exercise every day.","我们每天运动。")],
"f": [("four","四","sì","4️⃣","noun","I have four crayons.","我有四支蜡笔。"),
      ("five","五","wǔ","5️⃣","noun","Five fingers on my hand.","我的手上有五个手指。"),
      ("feather","羽毛","yǔmáo","🪶","noun","The feather is soft and light.","羽毛又软又轻。"),
      ("family","家庭","jiātíng","👨‍👩‍👧","noun","I love my family.","我爱我的家庭。"),
      ("funny","有趣","yǒuqù","🤣","adjective","The clown is very funny.","小丑很有趣。"),
      ("full","满的","mǎn de","🈵","adjective","My tummy is full.","我的肚子饱了。")],
"g": [("garden","花园","huāyuán","🌷","noun","The flowers grow in the garden.","花在花园里生长。"),
      ("glasses","眼镜","yǎnjìng","👓","noun","Grandpa wears glasses.","爷爷戴眼镜。"),
      ("grandma","奶奶","nǎinai","👵","noun","Grandma bakes cookies.","奶奶烤饼干。"),
      ("grandpa","爷爷","yéye","👴","noun","Grandpa tells fun stories.","爷爷讲有趣的故事。"),
      ("grass","草","cǎo","🌱","noun","The grass is green and soft.","草是绿色和柔软的。"),
      ("gum","口香糖","kǒuxiāngtáng","🍬","noun","I chew my gum.","我嚼我的口香糖。")],
"h": [("hill","小山","xiǎoshān","🏞️","noun","We climb the hill.","我们爬小山。"),
      ("hair","头发","tóufa","💇","noun","She brushes her hair.","她刷她的头发。"),
      ("honey","蜂蜜","fēngmì","🍯","noun","The bear loves honey.","熊喜欢蜂蜜。"),
      ("hungry","饿","è","🤤","adjective","I feel hungry before lunch.","午饭前我觉得饿。"),
      ("heavy","重","zhòng","🪨","adjective","The rock is very heavy.","这块石头很重。"),
      ("hide","躲","duǒ","🙈","verb","Let's hide behind the tree.","我们躲在树后面吧。")],
"i": [("ill","生病","shēngbìng","🤒","adjective","I feel ill today.","我今天生病了。"),
      ("ink","墨水","mòshuǐ","🖋️","noun","The pen has blue ink.","这支笔有蓝色墨水。"),
      ("inside","里面","lǐmiàn","📦","adverb","The toy is inside the box.","玩具在盒子里面。")],
"j": [("jar","罐子","guànzi","🫙","noun","The jam is in a jar.","果酱在罐子里。"),
      ("joy","快乐","kuàilè","😃","adjective","Her face is full of joy.","她的脸上充满了快乐。"),
      ("join","加入","jiārù","🔗","verb","Come and join us!","来加入我们吧！")],
"k": [("kettle","水壶","shuǐhú","🫖","noun","The kettle boils water.","水壶把水烧开。"),
      ("king","国王","guówáng","🤴","noun","The king wears a crown.","国王戴着王冠。"),
      ("knee","膝盖","xīgài","🦵","noun","I hurt my knee.","我伤了膝盖。"),
      ("knock","敲","qiāo","✊","verb","Knock on the door first.","先敲门。")],
"l": [("lake","湖","hú","🌊","noun","We swim in the lake.","我们在湖里游泳。"),
      ("lettuce","生菜","shēngcài","🥬","noun","The rabbit eats lettuce.","兔子吃生菜。"),
      ("library","图书馆","túshūguǎn","📚","noun","I borrow books from the library.","我从图书馆借书。"),
      ("lizard","蜥蜴","xīyì","🦎","noun","The lizard suns itself on a rock.","蜥蜴在石头上晒太阳。"),
      ("lollipop","棒棒糖","bàngbàngtáng","🍭","noun","I lick my lollipop.","我舔我的棒棒糖。"),
      ("love","爱","ài","😍","verb","I love my family.","我爱我的家人。")],
"m": [("map","地图","dìtú","🗺️","noun","We look at the map.","我们看地图。"),
      ("magic","魔法","mófǎ","🪄","noun","The fairy has magic.","仙女有魔法。"),
      ("mailbox","邮箱","yóuxiāng","📮","noun","I post a letter in the mailbox.","我把信投进邮箱。"),
      ("messy","乱","luàn","🌀","adjective","My room is messy.","我的房间很乱。"),
      ("mitten","手套","shǒutào","🧤","noun","I wear mittens in winter.","冬天我戴手套。"),
      ("movie","电影","diànyǐng","🎬","noun","We watch a movie together.","我们一起看电影。")],
"n": [("nine","九","jiǔ","9️⃣","noun","Nine plus one is ten.","九加一等于十。"),
      ("necklace","项链","xiàngliàn","📿","noun","She wears a pretty necklace.","她戴着漂亮的项链。"),
      ("nice","友善","yǒushàn","😇","adjective","He is very nice to me.","他对我很友善。"),
      ("nap","午睡","wǔshuì","💤","noun","The baby takes a nap.","宝宝在午睡。"),
      ("notebook","笔记本","bǐjìběn","📓","noun","I write in my notebook.","我在笔记本上写字。")],
"o": [("one","一","yī","1️⃣","noun","I have one balloon.","我有一个气球。"),
      ("ocean","海洋","hǎiyáng","⛵","noun","The boat sails on the ocean.","船在海洋上航行。"),
      ("outside","外面","wàimiàn","🌤️","adverb","Let's play outside today.","我们今天去外面玩吧。")],
"p": [("panda","熊猫","xióngmāo","🐼","noun","The panda eats bamboo.","熊猫吃竹子。"),
      ("parrot","鹦鹉","yīngwǔ","🦜","noun","The parrot can talk.","鹦鹉会说话。"),
      ("pillow","枕头","zhěntou","🛋️","noun","I hug my soft pillow.","我抱着我软软的枕头。"),
      ("puzzle","拼图","pīntú","🧩","noun","I finish my puzzle.","我完成了我的拼图。"),
      ("popcorn","爆米花","bàomǐhuā","🍿","noun","We eat popcorn at the movies.","我们在电影院吃爆米花。"),
      ("proud","骄傲","jiāo'ào","😌","adjective","I am proud of you.","我为你感到骄傲。")],
"q": [("quiz","测验","cèyàn","📝","noun","We have a fun quiz today.","我们今天有一个有趣的测验。"),
      ("question","问题","wèntí","🤔","noun","I have a question.","我有一个问题。")],
"r": [("robot","机器人","jīqìrén","🤖","noun","The robot beeps and moves.","机器人发出哔哔声并移动。"),
      ("ring","戒指","jièzhi","💍","noun","She wears a shiny ring.","她戴着一个闪亮的戒指。"),
      ("river","河","hé","🚣","noun","We row on the river.","我们在河上划船。"),
      ("read","读","dú","📕","verb","I read a story every night.","我每晚读一个故事。"),
      ("round","圆","yuán","⚪","adjective","The ball is round.","球是圆的。"),
      ("rock","石头","shítou","🗿","noun","I climb over the rock.","我爬过石头。")],
"s": [("six","六","liù","6️⃣","noun","Six little ducks swim by.","六只小鸭子游过去。"),
      ("seven","七","qī","7️⃣","noun","There are seven days in a week.","一周有七天。"),
      ("scissors","剪刀","jiǎndāo","✂️","noun","I cut paper with scissors.","我用剪刀剪纸。"),
      ("shark","鲨鱼","shāyú","🦈","noun","The shark swims in the deep sea.","鲨鱼在深海里游泳。"),
      ("squirrel","松鼠","sōngshǔ","🐿️","noun","The squirrel hides its nuts.","松鼠藏起它的坚果。"),
      ("sparkle","闪亮","shǎnliàng","💫","adjective","The star sparkles at night.","星星在夜晚闪亮。")],
"t": [("two","二","èr","2️⃣","noun","I have two hands.","我有两只手。"),
      ("three","三","sān","3️⃣","noun","Three little pigs live here.","三只小猪住在这里。"),
      ("ten","十","shí","🔟","noun","I count all the way to ten.","我数到十。"),
      ("toy","玩具","wánjù","🎲","noun","I share my toy with you.","我和你分享我的玩具。"),
      ("thirsty","渴","kě","🚰","adjective","I feel thirsty after running.","跑步后我觉得渴。")],
"u": [("uncle","叔叔","shūshu","🧔","noun","My uncle tells jokes.","我叔叔讲笑话。"),
      ("upset","难过","nánguò","😞","adjective","She feels upset about the rain.","她因为下雨感到难过。")],
"v": [("vase","花瓶","huāpíng","🏺","noun","The flowers are in a vase.","花在花瓶里。"),
      ("vet","兽医","shòuyī","🩺","noun","The vet helps sick animals.","兽医帮助生病的动物。")],
"w": [("winter","冬天","dōngtiān","⛄","noun","We build a snowman in winter.","我们在冬天堆雪人。"),
      ("window","窗户","chuānghù","🪟","noun","I look out the window.","我看向窗户外面。"),
      ("wing","翅膀","chìbǎng","🪽","noun","The bird flaps its wing.","鸟拍打它的翅膀。"),
      ("wolf","狼","láng","🐺","noun","The wolf howls at the moon.","狼对着月亮嚎叫。"),
      ("wash","洗","xǐ","🧼","verb","I wash my hands before dinner.","晚饭前我洗手。")],
"y": [("yoga","瑜伽","yújiā","🧘","noun","We stretch and do yoga.","我们伸展身体做瑜伽。"),
      ("year","年","nián","📅","noun","I am five years old this year.","我今年五岁。")],
"z": [("zoom","快速移动","kuàisù yídòng","💨","verb","The car zooms past.","汽车飞快地开过去。")],
}

# --- fix: free up 👴 by moving old(O)'s emoji, so grandpa(G) can use 👴 ---
o_path = os.path.join(DIR, "o.json")
o_data = json.load(open(o_path, encoding="utf-8"))
for w in o_data["words"]:
    if w["id"].startswith("o") and w["word"] == "old":
        w["emoji"] = "🧓"
json.dump(o_data, open(o_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# --- append new words ---
index_letters = []
for letter in sorted(set(list(ADDITIONS.keys()) + [os.path.basename(f)[0] for f in glob.glob(f"{DIR}/*.json") if "index" not in f])):
    path = os.path.join(DIR, f"{letter}.json")
    data = json.load(open(path, encoding="utf-8"))
    existing_ids = [w["id"] for w in data["words"]]
    next_num = len(existing_ids) + 1
    for (word, wordZh, pinyin, emoji, pos, senEn, senZh) in ADDITIONS.get(letter, []):
        data["words"].append({
            "id": f"{letter}{next_num:03d}",
            "word": word, "wordZh": wordZh, "pinyin": pinyin, "emoji": emoji,
            "partOfSpeech": pos, "sentenceEn": senEn, "sentenceZh": senZh
        })
        next_num += 1
    json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    index_letters.append({"letter": letter, "count": len(data["words"])})

json.dump({"letters": index_letters}, open(os.path.join(DIR, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# --- report duplicate emoji so we can fix by hand if any slipped through ---
emoji_map = collections.defaultdict(list)
total = 0
for letter in index_letters:
    data = json.load(open(os.path.join(DIR, f"{letter['letter']}.json"), encoding="utf-8"))
    for w in data["words"]:
        emoji_map[w["emoji"]].append(f"{letter['letter']}:{w['word']}")
        total += 1
dupes = {k: v for k, v in emoji_map.items() if len(v) > 1}
print(f"Total words now: {total}")
print("Duplicate emoji check:", dupes if dupes else "ALL UNIQUE")
