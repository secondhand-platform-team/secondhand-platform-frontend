const FALLBACK_ICON = "/icon-caterogy/other.png";

type Rule = {
  keywords: string[];
  icon: string;
};

const ICON_RULES: Rule[] = [
  {
    keywords: [
      "dien-thoai",
      "linh-kien",
      "thiet-bi-choi-game",
      "may-tinh",
      "dong-ho",
      "may-anh",
    ],
    icon: "/icon-caterogy/device.png",
  },
  {
    keywords: [
      "quan-ao",
      "giay-dep",
      "tui-xach",
      "nuoc-hoa",
      "thoi-trang",
      "phu-kien",
    ],
    icon: "/icon-caterogy/clothes.png",
  },
  {
    keywords: [
      "noi-that",
      "giuong",
      "chan-ga-goi-nem",
      "gia-dung",
      "quat",
      "tu-lanh",
      "may-lanh",
      "may-giat",
      "nha-bep",
      "nha-tam",
    ],
    icon: "/icon-caterogy/interior.png",
  },
  {
    keywords: ["sach"],
    icon: "/icon-caterogy/book.png",
  },
  {
    keywords: [
      "dich-vu",
      "sua-chua",
      "bao-duong",
      "chuyen-nha",
      "don-dep",
    ],
    icon: "/icon-caterogy/home_repair_service.png",
  },
];

export const getCategoryIconBySlug = (slug?: string | null) => {
  if (!slug) {
    return FALLBACK_ICON;
  }

  const normalizedSlug = slug.toLowerCase();
  const matchedRule = ICON_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedSlug.includes(keyword)),
  );

  return matchedRule?.icon ?? FALLBACK_ICON;
};
