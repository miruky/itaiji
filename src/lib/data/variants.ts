/**
 * 人名・地名で使われる異体字のグループ。
 * canonicalは通用字体、variantsはその異体。新旧字体の関係ではないものを集める。
 * 「正規化」モードでは variants を canonical へ写すが、固有名詞の字体は
 * 本人の表記が正であるため、UIではその旨を注記する。
 */
export interface VariantEntry {
  canonical: string;
  variants: readonly string[];
  note: string;
}

export const VARIANT_ENTRIES: readonly VariantEntry[] = [
  {
    canonical: '高',
    variants: ['髙'],
    note: 'いわゆる「はしごだか」。高橋・高田などの姓で使われる',
  },
  {
    canonical: '崎',
    variants: ['﨑'],
    note: 'いわゆる「たつさき」。山崎・宮崎などの姓で使われる',
  },
  {
    canonical: '島',
    variants: ['嶋', '嶌'],
    note: '姓の中島・小島などで嶋・嶌の表記がある',
  },
  {
    canonical: '辺',
    variants: ['邊', '邉'],
    note: '渡辺の「辺」には邊・邉をはじめ多数の異体がある',
  },
  {
    canonical: '国',
    variants: ['國', '圀'],
    note: '圀は則天文字に由来し、徳川光圀の名で知られる',
  },
  {
    canonical: '吉',
    variants: ['𠮷'],
    note: '上が「土」の「つちよし」。基本多言語面の外にあり文字化けしやすい',
  },
  {
    canonical: '桧',
    variants: ['檜'],
    note: '檜山・桧山など。檜が本来の字体で桧は略字',
  },
  {
    canonical: '曽',
    variants: ['曾'],
    note: '曽根・木曽など。戸籍では曾の表記も多い',
  },
  {
    canonical: '槙',
    variants: ['槇'],
    note: '槙原・槇原など。印刷字体の違いに由来する',
  },
  {
    canonical: '遥',
    variants: ['遙'],
    note: '人名の「はるか」で遙の表記がある',
  },
  {
    canonical: '祢',
    variants: ['禰'],
    note: '祢津・禰宜など。示偏の画数違い',
  },
];
