import React from "react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <GridContainer className="w-full">
        <GridItem md={12} className="text-center">
          <h1 className="text-[10rem] leading-none font-bold text-white/80 mb-2">404</h1>
          <h2 className="text-3xl font-semibold text-white mb-3">Page not found :(</h2>
          <h4 className="text-lg text-white/70">Ooooups! Looks like you got lost.</h4>
        </GridItem>
      </GridContainer>
    </div>
  );
}
