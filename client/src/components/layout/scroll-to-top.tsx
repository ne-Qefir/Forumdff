import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const checkScrollPosition = () => {
    // Показываем кнопку, когда страница прокручена более чем на 300px
    if (!showScrollTop && window.scrollY > 300) {
      setShowScrollTop(true);
    } else if (showScrollTop && window.scrollY <= 300) {
      setShowScrollTop(false);
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", checkScrollPosition);
    
    // Проверка на первом рендере
    checkScrollPosition();
    
    return () => window.removeEventListener("scroll", checkScrollPosition);
  }, [showScrollTop]);

  return showScrollTop ? (
    <button 
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all duration-300 ease-in-out z-30 transform hover:scale-110 focus:outline-none"
      aria-label="Наверх"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  ) : null;
}