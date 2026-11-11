import { useState } from "react";
import { Star } from "lucide-react";
import { CUSTOMER_REVIEWS } from "../lib/customer-reviews";

type ReviewSort = "shared" | "highest" | "lowest";

export function CustomerReviews() {
  const [sort, setSort] = useState<ReviewSort>("shared");
  const reviews = [...CUSTOMER_REVIEWS];
  if (sort !== "shared") {
    reviews.sort((a, b) => (sort === "highest" ? b.rating - a.rating : a.rating - b.rating));
  }
  return (
    <section
      id="customer-reviews"
      className="ab-section ab-wrap ab-reviews"
      aria-labelledby="reviews-title"
    >
      <div className="ab-reviews-heading">
        <div>
          <p className="ab-eyebrow">CUSTOMER REVIEWS</p>
          <h2 id="reviews-title">
            What customers <span>are saying.</span>
          </h2>
          <p className="ab-reviews-intro">Selected feedback shared by the seller.</p>
        </div>
        <label className="ab-review-sort">
          Sort reviews
          <select value={sort} onChange={(event) => setSort(event.target.value as ReviewSort)}>
            <option value="shared">As shared</option>
            <option value="highest">Rating: highest first</option>
            <option value="lowest">Rating: lowest first</option>
          </select>
        </label>
      </div>
      <ol className="ab-review-list">
        {reviews.map((review) => (
          <li key={review.id} data-review-id={review.id} data-rating={review.rating}>
            <article className="ab-review-card" aria-label={"Review by " + review.name}>
              <header>
                <span className="ab-review-avatar" aria-hidden="true">
                  {review.name === "Anonymous"
                    ? "A"
                    : review.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                </span>
                <div>
                  <span
                    className="ab-review-stars"
                    role="img"
                    aria-label={review.rating + " out of 5 stars"}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={21}
                        aria-hidden="true"
                        fill={star <= review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </span>
                  <p className="ab-review-name">{review.name}</p>
                </div>
              </header>
              {"title" in review && <h3>{review.title}</h3>}
              <blockquote>
                <p>{review.text}</p>
              </blockquote>
            </article>
          </li>
        ))}
      </ol>
      <p className="ab-review-note">
        Selected reviews supplied by the seller. Translated into English.
      </p>
    </section>
  );
}
