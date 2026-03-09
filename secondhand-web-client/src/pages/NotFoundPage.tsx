/**
 * Not Found Page
 * 404 error page
 */

import React from "react";
import Button from "@/components/common/Button/Button";
import { ROUTES } from "@/config/routes";

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <h1 className="not-found-code">404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <Button variant="primary" size="large">
          <a
            href={ROUTES.HOME}
            style={{ textDecoration: "none", color: "white" }}
          >
            Go Home
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
