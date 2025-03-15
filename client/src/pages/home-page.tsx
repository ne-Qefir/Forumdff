import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Topic } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { TopicCard } from "@/components/forum/topic-card";
import { Pagination } from "@/components/ui/pagination";
import { 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationPrevious, 
  PaginationNext, 
  PaginationEllipsis 
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TopicWithAuthor = Topic & { 
  author: { 
    id: number; 
    username: string; 
    role: string; 
    avatar?: string;
  } | null 
};

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: topics = [], isLoading } = useQuery<TopicWithAuthor[]>({
    queryKey: ["/api/topics"],
  });

  // Filter topics by category
  const filteredTopics = topics.filter((topic) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "popular") {
      // Implement popular filter logic if needed
      return true;
    }
    return topic.category === activeCategory;
  });

  // Sort topics
  const sortedTopics = [...filteredTopics].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortOrder === "popular") {
      // Placeholder for popularity sorting
      return 0;
    } else { // "comments"
      // Placeholder for comment count sorting
      return 0;
    }
  });

  // Paginate topics
  const pageCount = Math.ceil(sortedTopics.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTopics = sortedTopics.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  // Generate page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= pageCount; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="min-h-screen text-white">
      <Header />

      <div className="container mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar 
          activeCategory={activeCategory} 
          onSelectCategory={setActiveCategory} 
        />

        {/* Main Content */}
        <div className="md:flex-1 md:ml-6">
          {/* Forum Header */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-sans font-bold">
              {activeCategory === "all" 
                ? "Последние темы" 
                : activeCategory === "popular" 
                  ? "Популярные темы" 
                  : activeCategory}
            </h2>
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-400">Сортировать:</span>
              <Select
                value={sortOrder}
                onValueChange={setSortOrder}
              >
                <SelectTrigger className="bg-secondary-bg border-divider w-[180px]">
                  <SelectValue placeholder="Выберите сортировку" />
                </SelectTrigger>
                <SelectContent className="bg-secondary-bg border-divider">
                  <SelectItem value="newest">Новые</SelectItem>
                  <SelectItem value="popular">Популярные</SelectItem>
                  <SelectItem value="comments">По комментариям</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Topic Cards */}
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-secondary-bg rounded-xl overflow-hidden mb-6 shadow-md">
                <div className="p-4 border-b border-divider">
                  <div className="flex items-start">
                    <Skeleton className="flex-shrink-0 mr-4 w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-60 w-full mb-4 rounded-md" />
                  <div className="flex justify-between">
                    <div className="flex space-x-4">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ))
          ) : currentTopics.length > 0 ? (
            currentTopics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))
          ) : (
            <div className="text-center py-12 bg-secondary-bg rounded-xl">
              <h3 className="text-xl font-medium mb-2">Нет доступных тем</h3>
              <p className="text-gray-400">
                {activeCategory === "all"
                  ? "Еще не создано ни одной темы. Будьте первым!"
                  : `В категории "${activeCategory}" еще нет тем.`}
              </p>
            </div>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {pageNumbers.map(number => {
                    // Show first page, current page, last page, and pages around current
                    if (
                      number === 1 || 
                      number === pageCount || 
                      (number >= currentPage - 1 && number <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={number}>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(number);
                            }}
                            isActive={number === currentPage}
                            className={number === currentPage ? "bg-bright-blue-gray" : "bg-secondary-bg"}
                          >
                            {number}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    // Show ellipsis where needed
                    if (number === 2 && currentPage > 3) {
                      return (
                        <PaginationItem key="ellipsis-1">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    if (number === pageCount - 1 && currentPage < pageCount - 2) {
                      return (
                        <PaginationItem key="ellipsis-2">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < pageCount) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === pageCount ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}