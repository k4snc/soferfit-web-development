import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { reviews } from "../data/reviews";

export function ReviewCarousel() {
  const [activeReview, setActiveReview] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) return;
    const interval = window.setInterval(() => {
      setActiveReview((current) => (current + 1) % reviews.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isPaused]);

  const finishSwipe = (clientX: number) => {
    if (touchStart.current === null) return;
    const distance = clientX - touchStart.current;
    if (Math.abs(distance) > 45) {
      setActiveReview((current) => (
        distance < 0
          ? (current + 1) % reviews.length
          : (current - 1 + reviews.length) % reviews.length
      ));
    }
    touchStart.current = null;
  };

  const review = reviews[activeReview];

  return (
    <div
      className="review-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
      onTouchEnd={(event) => finishSwipe(event.changedTouches[0].clientX)}
      aria-label="Member reviews"
    >
      <div className="review-slide" aria-live="polite">
        <span className={`review-avatar avatar-${activeReview + 1}`}>{review.initials}</span>
        <div className="review-content">
          <div className="review-meta">
            <strong>{review.name}</strong>
            <span className="review-stars" aria-label="5 out of 5 stars">
              {[0, 1, 2, 3, 4].map((star) => <Icon key={star} name="star" />)}
            </span>
          </div>
          <p>{review.comment}</p>
        </div>
      </div>
      <div className="review-dots" aria-label="Choose a review">
        {reviews.map((item, index) => (
          <button
            key={item.name}
            className={activeReview === index ? "active" : ""}
            onClick={() => setActiveReview(index)}
            aria-label={`Show review ${index + 1}`}
            aria-current={activeReview === index ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
