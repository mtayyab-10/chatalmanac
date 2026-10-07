/**
 * src/worker/stopwords.ts
 *
 * Per-language stopword lists for word frequency analysis.
 * A stopword is a common word (like "the", "and", "I") that
 * carries little meaning and should be excluded from word counts.
 */

const EN: Set<string> = new Set([
  'i','me','my','myself','we','our','ours','ourselves','you','your','yours',
  'he','him','his','she','her','hers','it','its','they','them','their','theirs',
  'what','which','who','whom','this','that','these','those','am','is','are',
  'was','were','be','been','being','have','has','had','do','does','did',
  'will','would','could','should','may','might','shall','can','need','dare',
  'a','an','the','and','but','or','nor','for','so','yet','at','by','in',
  'of','on','to','up','as','if','not','no','ok','yes','yeah','yep','nope',
  'just','like','get','got','go','going','come','came','coming','know','think',
  'want','need','really','very','also','too','then','than','when','where',
  'how','why','what','which','who','whom','well','still','even','much','more',
  'now','good','great','nice','right','sure','okay','actually','though',
  'already','always','never','ever','every','some','all','both','each',
  'few','more','most','other','into','through','during','before','after',
  'above','below','between','out','off','over','under','again','further',
  'once','here','there','when','where','why','how','any','both','few','more',
  'its','lol','haha','hahaha','oh','ah','wow','hey','hi','hello','bye',
  'im','ive','its','dont','doesnt','didnt','wont','cant','isnt','arent',
  'the','this','that','with','from','have','will','been','they','their',
]);

const AR: Set<string> = new Set([
  'في','من','إلى','على','عن','مع','هذا','هذه','ذلك','تلك','هو','هي',
  'هم','هن','أنا','أنت','أنتم','نحن','كان','كانت','كانوا','يكون',
  'تكون','لا','لم','لن','قد','أن','إن','ما','مما','حيث','التي',
  'الذي','الذين','اللاتي','وقد','وكان','وكانت','وهو','وهي','وهم',
  'أي','كل','بعض','غير','حتى','بل','ثم','أو','أم','إما','لأن',
  'لكن','ولكن','مثل','عند','منذ','قبل','بعد','خلال','حول','بين',
  'يا','كم','كيف','متى','أين','ماذا','لماذا','يعني','طيب','حسنا',
  'نعم','لا','اوك','اوكي','هههه','هاها','واو',
]);

const UR: Set<string> = new Set([
  'میں','نے','کو','کے','کا','کی','ہے','ہیں','تھا','تھی','تھے',
  'اور','یا','کہ','جو','یہ','وہ','اس','ان','ہم','آپ','تم','مجھے',
  'اسے','انہیں','ہمیں','تمہیں','آپ','کیا','کیسے','کیوں','کب','کہاں',
  'سے','پر','تک','میں','بھی','تو','ہی','پھر','اب','جب','جہاں',
  'لیکن','مگر','بلکہ','چونکہ','کیونکہ','اگر','تاکہ','ہاں','نہیں',
  'جی','ٹھیک','اچھا','ارے','یار','بھائی','بہن','پیارے',
]);

const FR: Set<string> = new Set([
  'le','la','les','un','une','des','du','de','à','en','et','ou','mais',
  'donc','or','ni','car','je','tu','il','elle','nous','vous','ils','elles',
  'me','te','se','lui','leur','y','en','qui','que','quoi','dont','où',
  'ce','cet','cette','ces','mon','ton','son','ma','ta','sa','nos','vos',
  'leurs','sur','dans','par','pour','avec','sans','sous','après','avant',
  'pendant','depuis','chez','entre','pas','plus','très','bien','aussi',
  'non','oui','ouais','ok','ah','oh','ha','haha','lol','voilà','alors',
  'donc','quand','comment','pourquoi','combien','quel','quelle','est','sont',
  'avoir','être','faire','aller','venir','pouvoir','vouloir','savoir',
  'falloir','devoir','parce','comme','si','même','tout','tous','toute',
]);

export function getStopwords(lang: string): Set<string> {
  switch (lang.slice(0, 2).toLowerCase()) {
    case 'ar': return AR;
    case 'ur': return UR;
    case 'fr': return FR;
    default:   return EN;
  }
}

/** Returns the English stopword set (always available). */
export function getEnglishStopwords(): Set<string> {
  return EN;
}
