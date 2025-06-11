(async function () {
  async function getData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const json = await response.json();
      return json;
    } catch (error) {
      console.error(error.message);
    }
  }

  const dataContainer = document.getElementById("data");
  const url = dataContainer.getAttribute("data-endpoint");
  const data = await getData(url);

  window.ega_curve_mo("#across-reference svg", data, {
    xAxis: "X Axis Name",
    yAxis: "Y Axis Name",
    title: "Graph Title",
    width:"auto",
  });
  window.ega_curve_mos("#across-reference-scroll svg", data, {
    xAxis: "X Axis Name",
    yAxis: "Y Axis Name",
    title: "Graph Title",
    width:"auto",
    scrollRatio: 100,
  });
})();
