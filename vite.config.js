export default {
  build: {
    lib: {
      entry: "index.js",
      name: "Bloom",
    },
    rollupOptions: {
      external: ["s-js"],
      output: {
        globals: {
          vue: "Bloom",
        },
      },
    },
  },
};
