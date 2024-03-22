import React from "react";
import styles from "./Cover.module.css";

export const Cover = ({ src }) => {
  return <img className={styles.cover} src={src} />;
};
