(() => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(error => {
      console.warn("Não foi possível preparar o acesso offline:", error);
    });
  });
})();
