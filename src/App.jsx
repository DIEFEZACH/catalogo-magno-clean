import React from "react";
import CatalogoMagnoClean from "./components/CatalogoMagnoClean";
import products from "./data/products.json";

export default function App() {
  return <CatalogoMagnoClean products={products} />;
}