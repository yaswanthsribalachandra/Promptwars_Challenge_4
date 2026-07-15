/**
 * @fileoverview Multilingual chatbot simulated responses engine.
 * Maps keywords to translated stadium information for local fallback execution.
 */

export const simulatedQA = {
  en: {
    bag: '🎒 <strong>FIFA Stadium Bag Policy:</strong> Only clear bags smaller than 12x6x12 inches (30x15x30 cm) or small clutch bags (4.5x6.5 inches) are allowed. Backpacks and larger purses are prohibited.',
    transit:
      '🚇 <strong>Transit Status:</strong> Metro Line A is experiencing severe post-game congestion (wait times ~35 mins). We recommend taking the Park & Ride Shuttles (East/West gate lanes, wait ~15 mins) or walking to the Rideshare Hub in Zone F.',
    accessible:
      '♿ <strong>Accessibility Info:</strong> Elevators are located at Gates A, B, and C. A quiet sensory room is available behind Section 104 next to the medical station. Accessible ramps lead directly to Section 102 and 104.',
    food: '🌭 <strong>Concessions & Dietary Options:</strong> Vegetarian hot dogs, vegan burgers, and Halal-certified snacks are available at the concessions stand near Gate C (behind Section 104) and Section 102.',
    schedule:
      "🏆 <strong>Match Schedule:</strong> Today's World Cup Match features USA vs Mexico. Kickoff is at 8:00 PM. Stadium gates open 3 hours prior at 5:00 PM.",
    welcome:
      '⚽ Welcome to the stadium! How can I assist you with navigation, policies, accessibility, or transit?',
    default:
      "I've processed your query about the stadium. If you need navigation help, enter your seat code in the seat locator. Can I help you with transport, bags, or accessibility details?",
  },
  es: {
    bag: '🎒 <strong>Política de bolsos de la FIFA:</strong> Solo se permiten bolsos transparentes de menos de 12x6x12 pulgadas (30x15x30 cm) o bolsos de mano pequeños (4.5x6.5 pulgadas). Las mochilas están prohibidas.',
    transit:
      '🚇 <strong>Estado del tránsito:</strong> La Línea A del Metro experimenta una congestión severa después del partido (espera de ~35 min). Se recomienda tomar los autobuses de traslado (carriles A/C, espera de ~15 min) o caminar al Rideshare Hub en la Zona F.',
    accessible:
      '♿ <strong>Accesibilidad:</strong> Los ascensores se ubican en las Puertas A, B y C. Una sala sensorial tranquila está disponible detrás de la Sección 104. Las rampas accesibles conducen directamente a las secciones 102 y 104.',
    food: '🌭 <strong>Alimentos y opciones dietéticas:</strong> Hot dogs vegetarianos, hamburguesas veganas y alimentos Halal están disponibles cerca de la Puerta C (detrás de la Sección 104) y la Sección 102.',
    schedule:
      '🏆 <strong>Horario del partido:</strong> El partido de hoy es EE. UU. vs México. El inicio es a las 8:00 PM. Las puertas del estadio abren a las 5:00 PM.',
    welcome:
      '⚽ ¡Bienvenido al estadio! ¿Cómo puedo ayudarle con la navegación, las políticas, la accesibilidad o el tránsito?',
    default:
      'He procesado su consulta sobre el estadio. Si necesita ayuda de navegación, ingrese su código de asiento en el localizador. ¿Puedo ayudarle con transporte, bolsos o detalles de accesibilidad?',
  },
  fr: {
    bag: '🎒 <strong>Politique des sacs FIFA:</strong> Seuls les sacs transparents de moins de 12x6x12 pouces (30x15x30 cm) ou les petites pochettes (4.5x6.5 pouces) sont autorisés. Les sacs à dos sont interdits.',
    transit:
      '🚇 <strong>Info Transport:</strong> La ligne de métro A est très encombrée (attente ~35 min). Nous vous conseillons les navettes gratuites (portes Est/Ouest, attente ~15 min) ou le hub de covoiturage en Zone F.',
    accessible:
      "♿ <strong>Accessibilité:</strong> Des ascenseurs sont situés aux portes A, B et C. Une salle sensorielle calme est disponible derrière la section 104. Des rampes d'accès mènent directement aux sections 102 et 104.",
    food: '🌭 <strong>Restauration:</strong> Des options végétariennes, végétaliennes et Halal sont disponibles près de la porte C (derrière la section 104) et de la section 102.',
    schedule:
      "🏆 <strong>Match:</strong> Aujourd'hui: États-Unis contre Mexique. Coup d'envoi à 20h00. Les portes du stade ouvrent à 17h00.",
    welcome:
      "⚽ Bienvenue au stade ! Comment puis-je vous aider pour l'orientation, le règlement ou les transports ?",
    default:
      "J'ai traité votre demande. Pour obtenir de l'aide sur l'orientation, veuillez saisir votre numéro de siège. Puis-je vous aider pour les transports, les sacs ou l'accessibilité ?",
  },
  pt: {
    bag: '🎒 <strong>Política de Bolsas FIFA:</strong> Apenas bolsas transparentes menores que 12x6x12 polegadas (30x15x30 cm) ou bolsas de mão pequenas são permitidas. Mochilas são proibidas.',
    transit:
      '🚇 <strong>Trânsito:</strong> A linha A do metrô está com alta lentidão pós-jogo (espera ~35 min). Recomendamos os ônibus circulares de traslado (espera ~15 min) ou o ponto de Rideshare na Zona F.',
    accessible:
      '♿ <strong>Acessibilidade:</strong> Elevadores localizados nos Portões A, B e C. Sala sensorial disponível atrás do Setor 104. Rampas acessíveis levam aos Setores 102 e 104.',
    food: '🌭 <strong>Alimentação:</strong> Cachorros-quentes vegetarianos, hambúrgueres veganos e opções Halal perto do Portão C (atrás do Setor 104) e Setor 102.',
    schedule:
      '🏆 <strong>Horário do Jogo:</strong> O jogo de hoje é EUA contra México. Início às 20h. Portões abrem às 17h.',
    welcome:
      '⚽ Bem-vindo ao estádio! Como posso ajudar com a navegação, regras, acessibilidade ou transporte?',
    default:
      'Processei sua dúvida. Se precisar de direções, insira seu código de assento. Posso ajudar com transporte, bolsas ou acessibilidade?',
  },
  ar: {
    bag: '🎒 <strong>سياسة الحقائب للفيفا:</strong> يُسمح فقط بالحقائب الشفافة التي يقل حجمها عن 12×6×12 بوصة (30×15×30 سم) أو الحقائب الصغيرة جداً. يُمنع دخول حقائب الظهر.',
    transit:
      '🚇 <strong>حالة النقل:</strong> يشهد خط المترو A ازدحاماً شديداً بعد المباراة (الانتظار حوالي 35 دقيقة). نوصي باستخدام حافلات النقل الترددي (انتظار 15 دقيقة) أو التوجه إلى منطقة سيارات الأجرة في المنطقة F.',
    accessible:
      '♿ <strong>معلومات ذوي الاحتياجات الخاصة:</strong> تتوفر المصاعد في البوابات A و B و C. توجد غرفة حسية هادئة خلف القسم 104 بجوار النقطة الطبية.',
    food: '🌭 <strong>خيارات الأطعمة:</strong> تتوفر مأكولات نباتية وخيارات حلال في المطاعم القريبة من البوابة C (خلف القسم 104) والقسم 102.',
    schedule:
      '🏆 <strong>جدول المباراة:</strong> مباراة اليوم تجمع بين الولايات المتحدة والمكسيك. تنطلق المباراة الساعة 8:00 مساءً. تفتح البوابات الساعة 5:00 مساءً.',
    welcome: '⚽ مرحباً بكم في الاستاد! كيف يمكنني مساعدتك في التنقل، السياسات، أو النقل؟',
    default:
      'لقد عالجت استفسارك. إذا كنت بحاجة للمساعدة في تحديد موقع مقعدك، أدخل رمز المقعد في محدد المواقع. هل تحتاج لمساعدة إضافية؟',
  },
  ja: {
    bag: '🎒 <strong>FIFA手荷物持ち込み規制:</strong> 12x6x12インチ（30x15x30 cm）以下の透明なバッグ、または小型クラッチバッグのみ持ち込み可能です。リュックサック等は禁止されています規定。',
    transit:
      '🚇 <strong>交通状況:</strong> 地下鉄A線は試合後の大混雑が発生しています（待ち時間約35分）。パーク＆ライドシャトル（待ち時間約15分）またはゾーンFの配車アプリハブの利用をお勧めします。',
    accessible:
      '♿ <strong>アクセシビリティ情報:</strong> エレベーターはゲートA、B、Cにあります。静かなセンサリールームはセクション104の医療ステーション横に設置されています。',
    food: '🌭 <strong>飲食フードオプション:</strong> ベジタリアンホットドッグ、ヴィーガンバーガー、ハラール対応フードは、セクション102とゲートC付近（セクション104裏）で提供しています。',
    schedule:
      '🏆 <strong>試合日程:</strong> 本日の対戦カードはアメリカ対メキシコです。キックオフは午後8時。開場は午後5時（3時間前）です。',
    welcome:
      '⚽ スタジアムへようこそ！ご案内、規則、交通案内、バリアフリー情報など、何かお手伝いできることはありますか？',
    default:
      'スタジアムについてのお問い合わせを処理しました。シートの案内が必要な場合は、シートコードを入力してください。その他、バッグ、交通、バリアフリーについてお困りですか？',
  },
};

/**
 * Searches the prompt query for keywords and returns matching local fallback replies.
 * Handles defensive input checks.
 *
 * @param {string} promptText - User raw query.
 * @param {string} lang - Language code ('en', 'es', etc.).
 * @returns {string} Response text with formatting.
 */
export function getSimulatedApiResponse(promptText, lang = 'en') {
  if (typeof promptText !== 'string') {
    return '';
  }
  const query = promptText.toLowerCase();
  const dict = simulatedQA[lang] || simulatedQA.en;

  if (
    query.includes('bag') ||
    query.includes('pack') ||
    query.includes('purse') ||
    query.includes('bols') ||
    query.includes('sac') ||
    query.includes('持ち込み') ||
    query.includes('バッグ')
  ) {
    return dict.bag;
  }
  if (
    query.includes('transit') ||
    query.includes('metro') ||
    query.includes('subway') ||
    query.includes('bus') ||
    query.includes('shuttle') ||
    query.includes('train') ||
    query.includes('transport') ||
    query.includes('مترو') ||
    query.includes('交通') ||
    query.includes('電車')
  ) {
    return dict.transit;
  }
  if (
    query.includes('access') ||
    query.includes('wheelchair') ||
    query.includes('elevator') ||
    query.includes('sensory') ||
    query.includes('ramp') ||
    query.includes('disab') ||
    query.includes('كرسي') ||
    query.includes('車椅子') ||
    query.includes('バリアフリー') ||
    query.includes('エレベーター')
  ) {
    return dict.accessible;
  }
  if (
    query.includes('food') ||
    query.includes('eat') ||
    query.includes('drink') ||
    query.includes('vegetarian') ||
    query.includes('vegan') ||
    query.includes('halal') ||
    query.includes('comid') ||
    query.includes('nourriture') ||
    query.includes('طعام') ||
    query.includes('ベジタリアン') ||
    query.includes('フード')
  ) {
    return dict.food;
  }
  if (
    query.includes('schedule') ||
    query.includes('match') ||
    query.includes('time') ||
    query.includes('kickoff') ||
    query.includes('game') ||
    query.includes('partido') ||
    query.includes('heure') ||
    query.includes('مباراة') ||
    query.includes('スケジュール') ||
    query.includes('時間')
  ) {
    return dict.schedule;
  }

  return dict.default;
}
