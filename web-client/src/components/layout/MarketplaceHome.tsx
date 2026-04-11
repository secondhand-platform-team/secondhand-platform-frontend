"use client";

import { useEffect, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroSection from "@/components/home/HeroSection";
import SearchSection from "@/components/home/SearchSection";
import CategorySection from "@/components/home/CategorySection";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchTopCategories } from "@/stores/slices/category.slide";
import { getCategoryIconBySlug } from "@/utils/category-icon";
import Footer from "./Footer";

const featuredProducts = [
  {
    title: "Macbook Pro M1 2020 Like New 99%",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB7lHiWwSREvtKnnK_OkxDs_VIOr45dhii9q7as-9YezMRsuVUrrxVGJ8x3V7IvAAynHndevUkndeSghF9G_15ByDddKLSI7wISkinzsUoTnjBXIftZWAAWOm7B5e1ze_AWpe5vixUfreySnpR1FGKb8jHNZcL9zT9EDTB9xvdItGa9noZ3Nw1YeP87oGblLD6n4_tpSro0R_EKaXofqkKUbuBbVCWav2qEScwfh6f430BuEjBKuG_xmp1stFnKbQqO6IHrN6E4DRPG",
    price: "15.500.000đ",
    location: "Quận 1, TP. HCM",
    isFree: false,
  },
  {
    title: "Ghế gỗ Decor phong cách Vintage",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB2At51PEAqmrzCxK53b-YMNZImNeXJ2-ozfwjMz4oheWaLk9v5v1qXpBer5dRG2QmxtkS0O_gqTUcYYBccrtOq2ONRQcgtiKhU4u3deBUyhSvnFjS4d9wWHifHQCErcqnxhJ5X67i0pZfqpzEDdZc8pxbB1cJ_E1zuqlWM44fGPBuBE3KhGZf1a6wnfDiNISWx2zAOvYoeLs43SvIZoik9PUIma-SJg1oiuM70oN9uPigzH_Ce_n10SsJdS2OMXfKqyI6P2lu0iua-",
    price: "450.000đ",
    location: "Cầu Giấy, Hà Nội",
    isFree: false,
  },
  {
    title: "Bộ sách ôn thi Đại Học khối A, B",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCkLMzdu8Y2AcOKuptkrj7QyyBnO4Ge9jtPwX9-VpyFZlFMlpilQ-jwl7io5re2m0M_CZoW7CRdzI1Cv62KuitQNy3OfBlLarrCd4s3DxHFff1WCjFYn5Lx9-9BLL_eWoHuW8H8bKU_ixkAvJ-CKcoadgUeKxAQ7fKsxIhsP3t58oPywnH_E0MjFGsIpVkGzqiHx-SYeQz6xDFIkVdvECMPa_lyHytYIg6EfhlDV_S2eiE7MtfXNlLz0L7PbjE23f4onSvCMHAfeTXn",
    price: "Miễn phí",
    location: "Hải Châu, Đà Nẵng",
    isFree: true,
  },
  {
    title: "Giày Nike Air Max chính hãng size 42",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA0w3U_yyl5BuF2zktSFynduIssKDjm_R0QNlWnZMd0-Ruvz6kYBD4iB1RFadC1eGlf3DqfcIwkECZBziEm7LcuAUQli3CXgNpyO2C0JCtN4taqCN_3_SM0efqdS9adkqOsuMstIE4_oVFQOZZFpN_52sDFd-pRUltZFZVi1HYzGZSHiFrWz3HSmo8hfe_EWh8vhfq__6Kv6kHrjws3XA5aP2vaxI2_uDgTnhC_1abul3qfFGVHgJrbhvrEreJ_4fY5JKKEdE31jo2B",
    price: "850.000đ",
    location: "Quận 7, TP. HCM",
    isFree: false,
  },
];

export default function MarketplaceHome() {
  const dispatch = useAppDispatch();
  const { topCategories } = useAppSelector((state) => state.category);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchTopCategories());
  }, [dispatch]);

  const categories = topCategories
    .filter((category) => Boolean(category.slug))
    .map((category) => ({
      slug: category.slug as string,
      name: category.name,
      icon: getCategoryIconBySlug(category.slug),
    }));

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <main className="grow">
        <HeroSection onOpenAuth={() => setAuthOpen(true)} />
        <SearchSection />
        <CategorySection categories={categories} />
        <FeaturedProductsSection products={featuredProducts} />
        <HowItWorksSection />
      </main>

      <Footer />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
