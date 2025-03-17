function showTab(tabId) {
  console.log("showTab called with tabId:", tabId); // Debug log
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active");
  });
  document.getElementById(tabId).classList.add("active");
  document
    .querySelector(`button[onclick="showTab('${tabId}')"]`)
    .classList.add("active");

  // First remove any existing loading toasts
  document.querySelectorAll(".toast.loading").forEach((toast) => {
    toast.remove();
  });

  // Load specific data based on which tab is active
  if (tabId === "warehouse-edits") {
    // Load all warehouse edits when switching to the warehouse edits tab
    loadAllWarehouseEdits(true);
  } else if (tabId === "inventory") {
    // If switching to inventory tab, make sure to refresh it and show initial loading message
    console.log("Switching to inventory tab");

    // Create a persistent loading toast with a specific ID that won't auto-close
    const loadingToastId = "loading-inventory-" + Date.now();
    showToast("Sklady načteny.", "success");

    // Use setTimeout to slightly delay loading to ensure the toast is rendered
    setTimeout(() => {
      loadInventory(loadingToastId);
    }, 100);

    // Explicitly call addReportButtonsToWarehouses after a delay to catch cases when content is already loaded
    setTimeout(() => {
      addReportButtonsToWarehouses();
    }, 500);
  } else if (tabId === "orders") {
    // If switching to orders tab, load orders
    loadOrders();
  }
}

// Simplified showLoadingToast function to be more reliable
function showLoadingToast(message, toastId) {
  console.log("Creating loading toast with ID:", toastId);
  const container = document.querySelector(".toast-container");
  if (!container) {
    console.error("Toast container not found!");
    return null;
  }

  // Remove any existing toast with the same ID
  const existingToast = document.getElementById(toastId);
  if (existingToast) {
    existingToast.remove();
  }

  // Create a new toast
  const toast = document.createElement("div");
  toast.className = "toast loading";
  toast.id = toastId;

  toast.innerHTML = `
        <span class="toast-icon">⏳</span>
        <span class="toast-message">${message}</span>
        <span class="toast-close" onclick="removeToast('${toastId}')">×</span>
    `;

  container.appendChild(toast);
  console.log("Loading toast created with ID:", toastId);
  return toastId;
}

// New function for direct toast removal without animation
function removeToast(id) {
  const toast = document.getElementById(id);
  if (toast) {
    toast.remove();
  } else {
    console.warn(`Toast with ID ${id} not found`);
  }
}

// Add a function to generate the warehouse report modal
function showWarehouseReport(warehouseId, warehouseName, date) {
  console.log(
    `Report requested for warehouse: ${warehouseName} (ID: ${warehouseId}) on date: ${date}`
  );
  const toastId = showLoadingToast(
    `Načítání reportu pro ${warehouseName}...`,
    "warehouse-report-toast"
  );

  // Fetch the warehouse data for the selected date
  fetch(`/api/warehouse/status/${date}`, {
    headers: getAuthHeaders(),
  })
    .then((response) => {
      console.log("API response status:", response.status);
      if (!response.ok) {
        throw new Error(`Chyba při načítání dat skladu (${response.status})`);
      }
      return response.json();
    })
    .then((data) => {
      console.log(`Data received for ${data.length} warehouses`);
      removeToast(toastId);

      // Find the warehouse data by ID
      const warehouseData = data.find((w) => w.id === warehouseId);
      if (!warehouseData) {
        throw new Error(`Data pro sklad ID ${warehouseId} nebyla nalezena`);
      }

      console.log("Creating report modal with data:", warehouseData);
      // Create the modal
      createWarehouseReportModal(warehouseData, date);
    })
    .catch((error) => {
      console.error("Error creating warehouse report:", error);
      removeToast(toastId);
      showToast(error.message, "error");
    });
}

// Function to create the modal with the report
function createWarehouseReportModal(warehouseData, date) {
  // Format the date for display
  const formattedDate = new Date(date).toLocaleDateString("cs-CZ");

  // Check if modal already exists
  let modal = document.getElementById("warehouse-report-modal");
  if (modal) {
    modal.remove();
  }

  // Create modal
  modal = document.createElement("div");
  modal.id = "warehouse-report-modal";
  modal.className = "modal-overlay";

  // Define the item types with readable names
  const itemTypes = {
    kanoe: "Kánoe",
    kanoe_rodinna: "Kánoe rodinná",
    velky_raft: "Velký raft",
    padlo: "Pádlo",
    padlo_detske: "Pádlo dětské",
    vesta: "Vesta",
    vesta_detska: "Vesta dětská",
    barel: "Barel",
  };

  // Get inventory data
  const items = warehouseData.items;

  // Create HTML content for the report
  const modalContent = `
        <div class="modal-content report-modal">
            <div class="modal-header">
                <h3>Denní zpráva skladu - ${warehouseData.name}</h3>
                <span class="modal-close">&times;</span>
            </div>
            <div class="modal-body" id="report-content">
                <div class="report-header">
                    <h2>Denní zpráva skladu</h2>
                    <p><strong>Sklad:</strong> ${warehouseData.name}</p>
                    <p><strong>Datum:</strong> ${formattedDate}</p>
                    <p><strong>Místo:</strong> ${warehouseData.location}</p>
                </div>
                
                <div class="report-section">
                    <h4>Aktuální stav skladu</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Materiál</th>
                                <th>Počáteční stav</th>
                                <th>Výdej</th>
                                <th>Příjem</th>
                                <th>Konečný stav</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(itemTypes)
                              .map(([key, name]) => {
                                const itemData = items[key] || {};
                                const baseQuantity = itemData.baseQuantity || 0;
                                const outgoing =
                                  warehouseData.dailyPlan.departures.reduce(
                                    (sum, order) =>
                                      sum + (parseInt(order[key]) || 0),
                                    0
                                  );
                                const incoming =
                                  warehouseData.dailyPlan.returns.reduce(
                                    (sum, order) =>
                                      sum + (parseInt(order[key]) || 0),
                                    0
                                  );
                                const currentQuantity =
                                  itemData.currentQuantity || 0;

                                return `
                                    <tr>
                                        <td>${name}</td>
                                        <td>${baseQuantity}</td>
                                        <td>${
                                          outgoing > 0 ? `-${outgoing}` : "0"
                                        }</td>
                                        <td>${
                                          incoming > 0 ? `+${incoming}` : "0"
                                        }</td>
                                        <td>${currentQuantity}</td>
                                    </tr>
                                `;
                              })
                              .join("")}
                        </tbody>
                    </table>
                </div>
                
                ${
                  warehouseData.dailyPlan.departures.length > 0
                    ? `
                    <div class="report-section">
                        <h4>Výdej materiálu - objednávky (${
                          warehouseData.dailyPlan.departures.length
                        })</h4>
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>Č. obj.</th>
                                    <th>Čas</th>
                                    <th>Jméno</th>
                                    <th>Telefon</th>
                                    <th>Materiál</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${warehouseData.dailyPlan.departures
                                  .map(
                                    (order) => `
                                    <tr>
                                        <td>${order.id}</td>
                                        <td>${
                                          order.arrival_time?.substring(0, 5) ||
                                          "N/A"
                                        }</td>
                                        <td>${order.name || "N/A"}</td>
                                        <td>${order.phone || "N/A"}</td>
                                        <td>
                                            ${Object.entries(itemTypes)
                                              .map(([key, name]) => {
                                                const quantity =
                                                  parseInt(order[key]) || 0;
                                                return quantity > 0
                                                  ? `${name}: ${quantity}`
                                                  : "";
                                              })
                                              .filter((text) => text)
                                              .join(", ")}
                                        </td>
                                    </tr>
                                `
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                `
                    : ""
                }
                
                ${
                  warehouseData.dailyPlan.returns.length > 0
                    ? `
                    <div class="report-section">
                        <h4>Příjem materiálu - objednávky (${
                          warehouseData.dailyPlan.returns.length
                        })</h4>
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>Č. obj.</th>
                                    <th>Čas</th>
                                    <th>Jméno</th>
                                    <th>Telefon</th>
                                    <th>Materiál</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${warehouseData.dailyPlan.returns
                                  .map(
                                    (order) => `
                                    <tr>
                                        <td>${order.id}</td>
                                        <td>${
                                          order.departure_time?.substring(
                                            0,
                                            5
                                          ) || "N/A"
                                        }</td>
                                        <td>${order.name || "N/A"}</td>
                                        <td>${order.phone || "N/A"}</td>
                                        <td>
                                            ${Object.entries(itemTypes)
                                              .map(([key, name]) => {
                                                const quantity =
                                                  parseInt(order[key]) || 0;
                                                return quantity > 0
                                                  ? `${name}: ${quantity}`
                                                  : "";
                                              })
                                              .filter((text) => text)
                                              .join(", ")}
                                        </td>
                                    </tr>
                                `
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                `
                    : ""
                }
                
                ${
                  warehouseData.dailyPlan.edits &&
                  warehouseData.dailyPlan.edits.length > 0
                    ? `
                    <div class="report-section">
                        <h4>Úpravy stavu skladu (${
                          warehouseData.dailyPlan.edits.length
                        })</h4>
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>Čas</th>
                                    <th>Materiál</th>
                                    <th>Změna</th>
                                    <th>Nový stav</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${warehouseData.dailyPlan.edits
                                  .map(
                                    (edit) => `
                                    <tr>
                                        <td>${new Date(
                                          edit.created_at
                                        ).toLocaleTimeString("cs-CZ")}</td>
                                        <td>${
                                          itemTypes[edit.material_type] ||
                                          edit.material_type
                                        }</td>
                                        <td>${
                                          edit.new_quantity -
                                          edit.previous_quantity
                                        }</td>
                                        <td>${edit.new_quantity}</td>
                                    </tr>
                                `
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                `
                    : ""
                }
                
                <div class="report-footer">
                    <p>Report vygenerován: ${new Date().toLocaleString(
                      "cs-CZ"
                    )}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button id="print-report-btn" class="btn btn-secondary">Tisknout</button>
                <button class="btn modal-close-btn">Zavřít</button>
            </div>
        </div>
    `;

  modal.innerHTML = modalContent;
  document.body.appendChild(modal);

  // Add event listeners
  modal.querySelector(".modal-close").addEventListener("click", () => {
    modal.remove();
  });

  modal.querySelector(".modal-close-btn").addEventListener("click", () => {
    modal.remove();
  });

  // Print report button
  modal.querySelector("#print-report-btn").addEventListener("click", () => {
    printReport();
  });

  // Close when clicking outside the modal content
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Function to modify the warehouse titles to add the report button - updated with better debugging and more reliable click handlers
function addReportButtonsToWarehouses() {
  console.log("Adding report buttons to warehouses...");

  // Try multiple selectors to find warehouse headers
  const warehouseHeaders = document.querySelectorAll(".warehouse-header");
  console.log(`Found ${warehouseHeaders.length} warehouse headers`);

  if (warehouseHeaders.length === 0) {
    console.warn("No warehouse headers found. Check selector or timing.");
    return;
  }

  const selectedDate = document.getElementById("inventoryDate").value;
  console.log("Selected date for reports:", selectedDate);

  warehouseHeaders.forEach((header, index) => {
    try {
      // Find the warehouse card and get its warehouse ID
      const warehouseCard = header.closest(".warehouse-card");

      if (!warehouseCard) {
        console.warn(`Header ${index} is not inside a warehouse card`);
        return;
      }

      const warehouseId = parseInt(
        warehouseCard.getAttribute("data-warehouse-id")
      );
      if (!warehouseId) {
        console.warn(`Failed to get warehouse ID from warehouse card ${index}`);
        return;
      }

      // Get the warehouse name from the title
      const titleElement = header.querySelector(".warehouse-title");
      if (!titleElement) {
        console.warn(`Failed to find title element in warehouse card ${index}`);
        return;
      }

      const warehouseName = titleElement.textContent;
      console.log(
        `Processing warehouse: ${warehouseName} (ID: ${warehouseId})`
      );

      // Check if a report button already exists
      if (header.querySelector(".warehouse-report-btn")) {
        console.log(
          `Report button already exists for warehouse: ${warehouseName}`
        );
        return;
      }

      // Create the report button with a direct onclick handler for reliability
      const reportBtn = document.createElement("button");
      reportBtn.className = "btn btn-sm warehouse-report-btn";
      reportBtn.innerHTML = '<i class="fas fa-file-alt"></i> Report';
      reportBtn.title = "Zobrazit denní report skladu";

      // Use a direct onclick attribute for maximum compatibility
      reportBtn.setAttribute(
        "onclick",
        `showWarehouseReport(${warehouseId}, '${warehouseName.replace(
          /'/g,
          "\\'"
        )}', '${selectedDate}')`
      );

      // Add visual feedback when clicked (for debugging)
      reportBtn.addEventListener("click", function () {
        console.log(`Report button clicked for warehouse: ${warehouseName}`);
        this.style.backgroundColor = "#1e7e34"; // Change color briefly to show click
        setTimeout(() => {
          this.style.backgroundColor = ""; // Revert back after a short time
        }, 500);
      });

      // Append the button to the header
      header.appendChild(reportBtn);
      console.log(`Added report button to warehouse: ${warehouseName}`);
    } catch (error) {
      console.error("Error adding report button to warehouse:", error);
    }
  });
}

// Function to print the report
function printReport() {
  const reportContent = document.getElementById("report-content");

  if (!reportContent) {
    showToast("error", "Obsah reportu nenalezen");
    return;
  }

  // Create a new window for printing
  const printWindow = window.open("", "_blank");

  // Get CSS for proper styling
  const styles = Array.from(document.styleSheets)
    .filter(
      (sheet) => !sheet.href || sheet.href.startsWith(window.location.origin)
    )
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch (e) {
        console.warn("Cannot access stylesheet", e);
        return "";
      }
    })
    .join("\n");

  // Add custom print styles
  const printStyles = `
        @media print {
            body { margin: 0; padding: 15px; font-family: Arial, sans-serif; }
            .report-header { margin-bottom: 20px; }
            .report-section { margin-bottom: 20px; }
            .report-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .report-table th, .report-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .report-table th { background-color: #f2f2f2; }
            .report-footer { margin-top: 30px; font-size: 12px; color: #666; }
            h2 { margin-top: 0; }
            h4 { margin: 15px 0 10px 0; }
        }
    `;

  // Create HTML content for printing
  printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Denní report skladu</title>
            <style>${styles}\n${printStyles}</style>
        </head>
        <body>
            ${reportContent.innerHTML}
        </body>
        </html>
    `);

  printWindow.document.close();

  // Wait for content to load then print
  printWindow.onload = function () {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}

// Completely revised function to export PDF that matches print quality exactly
function exportToPDF(warehouseName, formattedDate) {
  const reportContent = document.getElementById("report-content");

  if (!reportContent) {
    showToast("Obsah reportu nenalezen", "error");
    return;
  }

  // Show loading message
  const loadingToastId = showLoadingToast(
    "Připravuji PDF...",
    "pdf-export-toast"
  );

  // Create a print-optimized window that will generate the PDF
  const printWindow = window.open("", "_blank");

  // Clean filename for the PDF
  const cleanName = warehouseName.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_");
  const cleanDate = formattedDate.replace(/\./g, "-");
  const filename = `Report_${cleanName}_${cleanDate}`;

  // Get CSS for proper styling
  const styles = Array.from(document.styleSheets)
    .filter(
      (sheet) => !sheet.href || sheet.href.startsWith(window.location.origin)
    )
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch (e) {
        console.warn("Cannot access stylesheet", e);
        return "";
      }
    })
    .join("\n");

  // Create enhanced print styles with improved PDF quality settings
  const printStyles = `
        @media print {
            @page {
                size: A4;
                margin: 1.5cm;
            }
            
            html, body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.3;
                color: #000;
                background: #fff;
            }
            
            .report-header {
                margin-bottom: 20px;
            }
            
            .report-header h2 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 18pt;
                font-weight: bold;
                color: #000;
            }
            
            .report-header p {
                margin: 5px 0;
                font-size: 12pt;
            }
            
            .report-section {
                margin-bottom: 20px;
                page-break-inside: avoid;
            }
            
            .report-section h4 {
                margin: 15px 0 10px 0;
                font-size: 14pt;
                font-weight: bold;
                color: #000;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            
            .report-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                page-break-inside: auto;
            }
            
            .report-table th, 
            .report-table td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
                font-size: 10pt;
            }
            
            .report-table th {
                background-color: #f2f2f2 !important;
                font-weight: bold;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .report-table tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            
            .report-footer {
                margin-top: 30px;
                font-size: 10pt;
                color: #666;
                text-align: right;
                border-top: 1px solid #ddd;
                padding-top: 10px;
            }
            
            /* Hide any non-printable elements */
            .modal-header, 
            .modal-footer, 
            .modal-close, 
            button {
                display: none !important;
            }
        }
    `;

  // Create HTML content for printing with optimized structure
  printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${filename}</title>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${styles}\n${printStyles}</style>
            <script>
                // Setup auto-print and download when content is loaded
                window.onload = function() {
                    // Short delay to ensure styles are applied
                    setTimeout(() => {
                        // This trick forces Chrome to download as PDF instead of showing print dialog
                        const printOptions = { 
                            destination: 'save-as-pdf',
                            filename: '${filename}',
                            margins: {
                                top: 1.5,
                                bottom: 1.5,
                                left: 1.5,
                                right: 1.5
                            },
                            preferCSSPageSize: true,
                            printBackground: true
                        };
                        
                        // Use the browser's print functionality to save as PDF
                        window.print();
                        
                        // Close the window after printing is done or cancelled
                        setTimeout(() => {
                            window.close();
                        }, 1000);
                    }, 500);
                };
            </script>
        </head>
        <body>
            <!-- Add special wrapper for better print handling -->
            <div class="print-container">
                ${reportContent.innerHTML}
            </div>
        </body>
        </html>
    `);

  printWindow.document.close();

  // Remove loading toast and show success message
  setTimeout(() => {
    removeToast(loadingToastId);
    showToast("PDF připraveno ke stažení", "success");
  }, 1500);
}

// Updated function to export PDF that matches print quality
function exportToPDF(warehouseName, formattedDate) {
  const reportContent = document.getElementById("report-content");

  if (!reportContent) {
    showToast("Obsah reportu nenalezen", "error");
    return;
  }

  // Create a new window for PDF generation that will use browser's print dialog
  const printWindow = window.open("", "_blank");

  // Get CSS for proper styling - same as in printReport function
  const styles = Array.from(document.styleSheets)
    .filter(
      (sheet) => !sheet.href || sheet.href.startsWith(window.location.origin)
    )
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch (e) {
        console.warn("Cannot access stylesheet", e);
        return "";
      }
    })
    .join("\n");

  // Add custom print styles with PDF-specific settings
  const printStyles = `
        @media print {
            body { 
                margin: 0; 
                padding: 15px; 
                font-family: Arial, sans-serif;
            }
            .report-header { 
                margin-bottom: 20px; 
            }
            .report-section { 
                margin-bottom: 20px; 
                page-break-inside: avoid;
            }
            .report-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 15px; 
            }
            .report-table th, .report-table td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
            }
            .report-table th { 
                background-color: #f2f2f2; 
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .report-footer { 
                margin-top: 30px; 
                font-size: 12px; 
                color: #666; 
            }
            h2 { margin-top: 0; }
            h4 { margin: 15px 0 10px 0; }
        }
        
        /* Clean filename for PDF */
        @page {
            size: A4;
            margin: 15mm;
        }
    `;

  // Clean the warehouse name for the filename
  const cleanName = warehouseName.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_");
  const cleanDate = formattedDate.replace(/\./g, "-");

  // Create HTML content for printing with title that will become the default filename
  printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Report_${cleanName}_${cleanDate}</title>
            <style>${styles}\n${printStyles}</style>
        </head>
        <body>
            ${reportContent.innerHTML}
        </body>
        </html>
    `);

  printWindow.document.close();

  // Wait for content to load then trigger print dialog
  printWindow.onload = function () {
    setTimeout(() => {
      // Show a toast notification to guide the user
      showToast("Otevírám dialog pro uložení PDF souboru...", "info");

      try {
        // Print dialog will offer Save as PDF option
        printWindow.print();

        // Show success message after a delay
        setTimeout(() => {
          showToast("PDF bylo úspěšně vygenerováno", "success");
        }, 1000);
      } catch (err) {
        console.error("Print error:", err);
        showToast("Nastala chyba při generování PDF: " + err.message, "error");
      }
    }, 500);
  };
}

// Updated function to export the report as PDF with direct download
function exportToPDF(warehouseName, formattedDate) {
  const loadingToastId = showLoadingToast(
    "Generování PDF...",
    "generate-pdf-toast"
  );

  // First check if we need to load the libraries
  const loadLibraries = () => {
    return new Promise((resolve, reject) => {
      // Check if libraries are already loaded
      if (typeof jspdf !== "undefined" && typeof html2canvas !== "undefined") {
        return resolve();
      }

      // Load html2canvas first
      const html2canvasScript = document.createElement("script");
      html2canvasScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      document.body.appendChild(html2canvasScript);

      html2canvasScript.onload = () => {
        // Then load jsPDF after html2canvas is loaded
        const jspdfScript = document.createElement("script");
        jspdfScript.src =
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        document.body.appendChild(jspdfScript);

        jspdfScript.onload = () => resolve();
        jspdfScript.onerror = () =>
          reject(new Error("Failed to load jsPDF library"));
      };

      html2canvasScript.onerror = () =>
        reject(new Error("Failed to load html2canvas library"));
    });
  };

  // Get the report content
  const reportContent = document.getElementById("report-content");
  if (!reportContent) {
    showToast("Obsah reportu nenalezen", "error");
    removeToast(loadingToastId);
    return;
  }

  // Start the PDF generation process
  loadLibraries()
    .then(() => {
      // Create a clone of the report content to avoid modifying the original
      const reportClone = reportContent.cloneNode(true);

      // Apply print-specific styles to the clone
      const printStyles = document.createElement("style");
      printStyles.textContent = `
                .report-header { margin-bottom: 20px; }
                .report-section { margin-bottom: 20px; page-break-inside: avoid; }
                .report-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .report-table th, .report-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .report-table th { background-color: #f2f2f2; }
                .report-footer { margin-top: 30px; font-size: 12px; color: #666; text-align: right; }
                h2 { margin-top: 0; font-size: 18px; }
                h4 { margin: 15px 0 10px 0; font-size: 14px; }
            `;
      reportClone.appendChild(printStyles);

      // Temporary append the clone to the document for rendering
      reportClone.style.position = "absolute";
      reportClone.style.left = "-9999px";
      document.body.appendChild(reportClone);

      // Use html2canvas to render the report content
      return html2canvas(reportClone, {
        scale: 2,
        useCORS: true,
        logging: false,
      }).then((canvas) => {
        // Clean up the temporary clone
        document.body.removeChild(reportClone);
        return canvas;
      });
    })
    .then((canvas) => {
      // Create PDF using jsPDF
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 0;

      // Add the image to the first page
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );

      // If the content is longer than one page, add more pages
      let heightLeft = imgHeight - pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      // Clean filename - replace special characters and spaces
      const cleanName = warehouseName
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "_");
      const cleanDate = formattedDate.replace(/\./g, "-");
      const filename = `Report_${cleanName}_${cleanDate}.pdf`;

      // Save the PDF - this triggers the download
      pdf.save(filename);

      // Show success message and remove loading toast
      removeToast(loadingToastId);
      showToast("PDF bylo úspěšně vygenerováno a staženo", "success");
    })
    .catch((error) => {
      console.error("Error generating PDF:", error);
      removeToast(loadingToastId);
      showToast("Chyba při generování PDF: " + error.message, "error");
    });
}

// Modify the existing function that loads warehouse inventory to add our buttons
const originalLoadInventory = window.loadInventory || function () {};
window.loadInventory = function (date) {
  originalLoadInventory(date);

  // Add a small delay to ensure the warehouse headers have loaded
  setTimeout(() => {
    addReportButtonsToWarehouses();
  }, 500);
};

// Ensure the buttons are added when the inventory tab is shown
document.addEventListener("DOMContentLoaded", () => {
  const inventoryTabLink = document.querySelector('a[href="#inventory-tab"]');
  if (inventoryTabLink) {
    inventoryTabLink.addEventListener("click", () => {
      setTimeout(() => {
        addReportButtonsToWarehouses();
      }, 500);
    });
  }
});

// Upravíme helper funkci pro API volání
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// Přidáme globální proměnné pro správu dat a řazení
let ordersData = [];
let currentSort = {
  column: "created_at",
  direction: "desc",
};

// Upravíme funkci loadOrders pro lepší debugování a přidáme toast notifikaci
async function loadOrders() {
  try {
    //console.log('Načítání seznamu objednávek...');
    const response = await fetch("/api/orders/list", {
      method: "GET",
      headers: getAuthHeaders(),
    });

    console.log("Status odpovědi:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Načtená data:", data);

    ordersData = data;
    renderOrders();

    // Bezpečně aktualizujeme počet objednávek pouze pokud element existuje
    const totalOrdersCountElement = document.getElementById("totalOrdersCount");
    const displayedOrdersCountElement = document.getElementById(
      "displayedOrdersCount"
    );

    if (totalOrdersCountElement) {
      totalOrdersCountElement.textContent = data.length;
    }

    if (displayedOrdersCountElement) {
      displayedOrdersCountElement.textContent = data.length;
    }

    // Přidáme přesnou notifikaci, která obsahuje text z logu serveru
    showToast(
      `Načítání seznamu objednávek...\nNačteno ${data.length} objednávek`,
      "success"
    );
  } catch (error) {
    console.error("Detailní chyba:", error);
    showError("Chyba při načítání objednávek: " + error.message);
  }
}

// Upravíme funkci pro řazení
function sortOrders(column) {
  console.log("Řazení podle:", column); // Debug log

  const th = document.querySelector(`th[onclick="sortOrders('${column}')"]`);
  document.querySelectorAll("th").forEach((header) => {
    if (header !== th) {
      header.classList.remove("sorted-asc", "sorted-desc");
    }
  });

  if (currentSort.column === column) {
    currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
  } else {
    currentSort.column = column;
    currentSort.direction = "asc";
  }

  th.classList.toggle("sorted-asc", currentSort.direction === "asc");
  th.classList.toggle("sorted-desc", currentSort.direction === "desc");

  // Opravíme řazení pro datum a čas
  ordersData.sort((a, b) => {
    let valueA, valueB;

    switch (column) {
      case "arrival":
        valueA = new Date(`${a.arrival_date}T${a.arrival_time}`);
        valueB = new Date(`${b.arrival_date}T${b.arrival_time}`);
        break;

      case "departure":
        valueA = new Date(`${a.departure_date}T${a.departure_time}`);
        valueB = new Date(`${b.departure_date}T${b.departure_time}`);
        break;

      case "created_at":
        valueA = new Date(a.created_at);
        valueB = new Date(b.created_at);
        break;

      default:
        valueA = a[column];
        valueB = b[column];
        if (typeof valueA === "string") {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
    }

    // Ošetření neplatných dat
    if (valueA instanceof Date && isNaN(valueA)) return 1;
    if (valueB instanceof Date && isNaN(valueB)) return -1;

    const direction = currentSort.direction === "asc" ? 1 : -1;
    if (valueA < valueB) return -1 * direction;
    if (valueA > valueB) return 1 * direction;
    return 0;
  });

  renderOrders();
}

// Funkce pro filtrování dat
function filterOrders() {
  let filteredData = [...ordersData];

  // Aplikujeme vyhledávání
  const searchTerm = document.getElementById("orderSearch").value.toLowerCase();
  if (searchTerm) {
    filteredData = filteredData.filter(
      (order) =>
        order.name.toLowerCase().includes(searchTerm) ||
        order.email.toLowerCase().includes(searchTerm) ||
        order.phone.toLowerCase().includes(searchTerm)
    );
  }

  // Aplikujeme filtr statusu
  const statusFilter = document.getElementById("statusFilter").value;
  if (statusFilter) {
    filteredData = filteredData.filter(
      (order) => order.status === statusFilter
    );
  }

  // Bezpečně aktualizujeme počet objednávek pouze pokud element existuje
  const displayedOrdersCountElement = document.getElementById(
    "displayedOrdersCount"
  );
  if (displayedOrdersCountElement) {
    displayedOrdersCountElement.textContent = filteredData.length;
  }

  // Vykreslíme filtrovaná data
  renderOrders(filteredData);
}

// Přidáme funkci pro formátování času
function formatTime(timeString) {
  if (!timeString) return "";
  try {
    return timeString.substring(0, 5); // Vezme pouze HH:MM část
  } catch (e) {
    console.error("Error formatting time:", e);
    return "";
  }
}

// Upravíme funkci renderOrders aby přijímala filtrovaná data
function renderOrders(filteredData = null) {
  // Pokud jsme nedostali filtrovaná data, použijeme všechna data
  if (filteredData === null) {
    filteredData = [...ordersData];
  }

  // Opravíme řazení pro datum a čas
  filteredData.sort((a, b) => {
    let valueA, valueB;

    switch (currentSort.column) {
      case "arrival_date":
        // Pro řazení podle data příjezdu
        valueA = new Date(`${a.arrival_date}T${a.arrival_time || "00:00"}`);
        valueB = new Date(`${b.arrival_date}T${b.arrival_time || "00:00"}`);
        break;

      case "departure_date":
        // Pro řazení podle data odjezdu
        valueA = new Date(`${a.departure_date}T${a.departure_time || "00:00"}`);
        valueB = new Date(`${b.departure_date}T${b.departure_time || "00:00"}`);
        break;

      case "created_at":
        // Pro řazení podle data vytvoření
        valueA = new Date(a.created_at);
        valueB = new Date(b.created_at);
        break;

      default:
        // Pro ostatní sloupce
        valueA = a[currentSort.column];
        valueB = b[currentSort.column];

        // Převedeme na malá písmena pro textové hodnoty
        if (typeof valueA === "string") {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
    }

    // Ošetření neplatných dat
    if (valueA instanceof Date && isNaN(valueA)) valueA = new Date(0);
    if (valueB instanceof Date && isNaN(valueB)) valueB = new Date(0);

    // Řazení podle směru
    const sortOrder = currentSort.direction === "asc" ? 1 : -1;
    return valueA < valueB ? -sortOrder : valueA > valueB ? sortOrder : 0;
  });

  // Vykreslíme data
  const tbody = document.getElementById("ordersList");
  tbody.innerHTML = filteredData
    .map(
      (order) => `
        <tr>
            <td>${order.id}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>${order.name}</td>
            <td>${order.email}</td>
            <td>${order.phone}</td>
            <td>${formatDate(order.arrival_date)} ${formatTime(
        order.arrival_time
      )}</td>
            <td>${formatDate(order.departure_date)} ${formatTime(
        order.departure_time
      )}</td>
            <td>${getStatusBadge(order.status)}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="viewOrder(${
                      order.id
                    })" class="btn-action btn-view" title="Detail">Detail</button>
                    <button onclick="updateOrderStatus(${
                      order.id
                    })" class="btn-action btn-status" title="Status">Status</button>
                    <button onclick="editOrder(${
                      order.id
                    })" class="btn-action btn-edit" title="Upravit">Upravit</button>
                    <button onclick="deleteOrder(${
                      order.id
                    })" class="btn-action btn-delete" title="Smazat">Smazat</button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");
}

async function loadUsers() {
  try {
    const response = await fetch("/users");
    const users = await response.json();
    const tbody = document.getElementById("usersList");

    tbody.innerHTML = users
      .map(
        (user) => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
            </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Chyba při načítání uživatelů:", error);
    alert("Chyba při načítání dat");
  }
}

async function viewOrder(orderId) {
  try {
    console.log("Fetching order:", orderId);

    const response = await fetch(`/api/orders/${orderId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `Server returned ${response.status}: ${response.statusText}`
      );
    }

    const responseText = await response.text();
    console.log("Raw response:", responseText); // Debug log

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON parse error:", e);
      throw new Error("Invalid JSON response from server");
    }

    if (!result.success) {
      throw new Error(result.message || "Unknown error");
    }

    const order = result.data;

    const detailHtml = `
            <h2>Detail objednávky #${order.id}</h2>
            <div class="order-detail-grid">
                <div class="detail-section">
                    <h3>Kontaktní údaje</h3>
                    <p><strong>Jméno:</strong> ${order.name}</p>
                    <p><strong>Email:</strong> ${order.email}</p>
                    <p><strong>Telefon:</strong> ${order.phone}</p>
                </div>
                
                <div class="detail-section">
                    <h3>Termín</h3>
                    <p><strong>Od:</strong> ${formatDate(
                      order.arrival_date
                    )} ${formatTime(order.arrival_time)}</p>
                    <p><strong>Do:</strong> ${formatDate(
                      order.departure_date
                    )} ${formatTime(order.departure_time)}</p>
                    <p><strong>Místo vyzvednutí:</strong> ${
                      order.pickup_location
                    }</p>
                    <p><strong>Místo vrácení:</strong> ${
                      order.return_location
                    }</p>
                </div>

                <div class="detail-section">
                    <h3>Vybavení</h3>
                    <p><strong>Kanoe:</strong> ${order.kanoe}x</p>
                    <p><strong>Rodinné kanoe:</strong> ${
                      order.kanoe_rodinna
                    }x</p>
                    <p><strong>Velký raft:</strong> ${order.velky_raft}x</p>
                    <p><strong>Pádla:</strong> ${order.padlo}x</p>
                    <p><strong>Dětská pádla:</strong> ${order.padlo_detske}x</p>
                    <p><strong>Vesty:</strong> ${order.vesta}x</p>
                    <p><strong>Dětské vesty:</strong> ${order.vesta_detska}x</p>
                    <p><strong>Barely:</strong> ${order.barel}x</p>
                </div>

                <div class="detail-section">
                    <h3>Doprava</h3>
                    <p><strong>Přeprava vybavení:</strong> ${
                      order.transport_items
                    }</p>
                    <p><strong>Přeprava osob:</strong> ${
                      order.transport_people
                    }</p>
                    <p><strong>Poznámka:</strong> ${order.order_note || "-"}</p>
                </div>
            </div>
        `;

    document.getElementById("orderDetail").innerHTML = detailHtml;
    document.getElementById("orderModal").style.display = "block";
  } catch (error) {
    console.error("Error details:", error);
    showError(`Chyba při načítání detailu objednávky: ${error.message}`);
  }
}

// Upravená funkce pro změnu statusu
async function updateOrderStatus(orderId) {
  try {
    const statusDialog = document.createElement("div");
    statusDialog.className = "status-dialog";
    statusDialog.innerHTML = `
            <div class="status-modal">
                <h3>Změna stavu objednávky</h3>
                <select id="statusSelect" class="status-select">
                    <option value="Nová">Nová</option>
                    <option value="Potvrzená">Potvrzená</option>
                    <option value="Dokončená">Dokončená</option>
                    <option value="Zrušená">Zrušená</option>
                </select>
                <div class="status-buttons">
                    <button onclick="submitStatus('${orderId}')" class="btn-confirm">Uložit</button>
                    <button onclick="closeStatusDialog()" class="btn-cancel">Zrušit</button>
                </div>
            </div>
        `;
    document.body.appendChild(statusDialog);
  } catch (error) {
    showError(`Chyba při změně stavu: ${error.message}`);
    console.error("Detailní chyba:", error);
  }
}

// Upravíme funkci pro odeslání statusu
async function submitStatus(orderId) {
  const select = document.getElementById("statusSelect");
  const newStatus = select.value;

  try {
    console.log("Odesílám status:", newStatus); // Pro debugging

    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Chyba při aktualizaci statusu");
    }

    await loadOrders();
    showMessage("Status byl úspěšně aktualizován");
    closeStatusDialog();
  } catch (error) {
    showError(`Chyba při aktualizaci statusu: ${error.message}`);
    console.error("Detailní chyba:", error);
  }
}

function closeStatusDialog() {
  const dialog = document.querySelector(".status-dialog");
  if (dialog) {
    dialog.remove();
  }
}

// Upravená funkce pro mazání objednávky
async function deleteOrder(orderId) {
  // Vytvoříme dialog pro potvrzení
  const deleteDialog = document.createElement("div");
  deleteDialog.className = "status-dialog";
  deleteDialog.innerHTML = `
        <div class="status-modal">
            <h3>Smazání objednávky</h3>
            <p>Opravdu chcete smazat tuto objednávku?</p>
            <div class="status-buttons">
                <button onclick="confirmDelete(${orderId})" class="btn-confirm">Smazat</button>
                <button onclick="closeDeleteDialog()" class="btn-cancel">Zrušit</button>
            </div>
        </div>
    `;
  document.body.appendChild(deleteDialog);
}

// Přidáme pomocné funkce pro mazání
async function confirmDelete(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    await loadOrders();
    showToast("Objednávka byla úspěšně smazána", "success");
    closeDeleteDialog();
  } catch (error) {
    showToast(`Chyba při mazání objednávky: ${error.message}`, "error");
    console.error("Detailní chyba:", error);
  }
}

function closeDeleteDialog() {
  const dialog = document.querySelector(".status-dialog");
  if (dialog) {
    dialog.remove();
  }
}

function getStatusBadge(status) {
  const statusClasses = {
    Nová: "badge-new",
    Potvrzená: "badge-confirmed",
    Dokončená: "badge-completed",
    Zrušená: "badge-cancelled",
  };

  return `<span class="badge ${statusClasses[status] || ""}">${status}</span>`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("cs-CZ");
}

function showToast(message, type = "success") {
  const container = document.querySelector(".toast-container");
  const toast = document.createElement("div");
  const id = "toast-" + Date.now();

  toast.className = `toast ${type}`;
  toast.id = id;

  // Add support for 'loading' type with a different icon, also update the default success icon
  let icon;
  switch (type) {
    case "success":
      icon = "✅"; // Explicitly use checkmark
      break;
    case "loading":
      icon = "⏳"; // Use hourglass for loading
      break;
    case "info":
      icon = "ℹ️";
      break;
    case "error":
      icon = "❌";
      break;
    default:
      icon = "✅";
  }

  toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <span class="toast-close" onclick="closeToast('${id}')">&times;</span>
    `;

  container.appendChild(toast);

  // Automatické zavření po 5 sekundách
  setTimeout(() => closeToast(id), 5000);
}

// Improved closeToast function with better error handling
function closeToast(id) {
  console.log("Attempting to close toast with ID:", id);
  const toast = document.getElementById(id);
  if (toast) {
    console.log("Found toast, adding hiding class");
    toast.classList.add("hiding");
    setTimeout(() => {
      console.log("Removing toast from DOM");
      if (document.getElementById(id)) {
        document.getElementById(id).remove();
      }
    }, 300);
  } else {
    console.warn("Toast with ID", id, "not found");
  }
}

// Nahrazení původních funkcí
function showError(message) {
  showToast(message, "error");
}

function showMessage(message) {
  showToast(message, "success");
}

// Upravíme kontrolu přihlášení
function checkAuth() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/login.html";
    return false;
  }
  return true;
}

// Přidáme handler pro odhlášení
function logout() {
  localStorage.removeItem("authToken");
  window.location.href = "/login.html";
}

// Přidáme funkci pro zobrazení uživatelského jména
function displayUsername() {
  try {
    const token = localStorage.getItem("authToken");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const usernameElement = document.getElementById("adminUsername");
      if (usernameElement) {
        usernameElement.textContent = payload.username || "Administrátor";
      }
    }
  } catch (error) {
    console.error("Chyba při načítání uživatelského jména:", error);
  }
}

// Upravíme funkci loadInventory pro načtení stavů skladů ke zvolenému datu
// Modified loadInventory function to properly handle toast removal
async function loadInventory(loadingToastId = null) {
  // First, remove any existing loading toasts to prevent duplicates
  document.querySelectorAll(".toast.loading").forEach((toast) => {
    toast.remove();
  });

  try {
    console.log("Starting loadInventory, toast ID:", loadingToastId);

    const date =
      document.getElementById("inventoryDate").value ||
      new Date().toISOString().split("T")[0];
    console.log("Loading inventory for date:", date);

    const response = await fetch(`/api/warehouse/status/${date}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Chyba při načítání dat skladů");
    const data = await response.json();
    console.log("Loaded warehouse data:", data);

    // Debug the received warehouse data
    debugWarehouseState(date, data);

    // Render the inventory data first
    renderInventory(data);

    // Explicitly call addReportButtonsToWarehouses here to ensure the buttons are added
    console.log("Adding report buttons after rendering inventory");
    setTimeout(() => {
      addReportButtonsToWarehouses();
    }, 300); // Give a bit more time for the DOM to fully update

    // Close the loading toast immediately and forcefully
    if (loadingToastId) {
      const loadingToast = document.getElementById(loadingToastId);
      if (loadingToast) {
        console.log("Force removing loading toast");
        loadingToast.remove(); // Directly remove without animation
      }
    }

    // Get the formatted date for the toast notification
    const formattedDate = new Date(date).toLocaleDateString("cs-CZ");

    try {
      // Now load warehouse edits in a separate try block
      const editsData = await loadWarehouseEdits(date);

      // Try to update the daily plan edits section
      try {
        await updateDailyPlanEdits(date);
      } catch (editUpdateError) {
        console.error("Error updating daily plan edits:", editUpdateError);
      }

      // Calculate statistics for toast notification
      let totalDepartures = 0;
      let totalReturns = 0;

      // Count departures and returns across all warehouses
      data.forEach((warehouse) => {
        if (warehouse.dailyPlan) {
          totalDepartures += warehouse.dailyPlan.departures
            ? warehouse.dailyPlan.departures.length
            : 0;
          totalReturns += warehouse.dailyPlan.returns
            ? warehouse.dailyPlan.returns.length
            : 0;
        }
      });

      // Get the count of warehouse edits
      const totalEdits = editsData ? editsData.length : 0;

      // Show success notification with statistics
      console.log("Showing success toast for inventory load");
      showToast(
        `Sklady načteny: ${formattedDate}\nPočet výdejů: ${totalDepartures}\nPočet vráceného vybavení: ${totalReturns}\nEdity skladů: ${totalEdits}`,
        "success"
      );
    } catch (secondaryError) {
      console.error("Error in secondary inventory operations:", secondaryError);

      // Show basic success toast even if secondary operations fail
      showToast(`Sklady načteny: ${formattedDate}`, "success");
    }
  } catch (error) {
    console.error("Error loading inventory:", error);

    // Close any loading toast on error
    if (loadingToastId) {
      const loadingToast = document.getElementById(loadingToastId);
      if (loadingToast) loadingToast.remove();
    }

    showError("Chyba při načítání stavu skladů: " + error.message);
  }
}

// Přidáme funkci pro načtení editů skladů pro zvolené datum
async function loadWarehouseEdits(date) {
  try {
    const response = await fetch(`/api/warehouse/edits/${date}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Chyba při načítání editů skladů");
    const data = await response.json();

    renderWarehouseEdits(data);

    // Now also update the daily plan sections with the same edit data
    updateDailyPlanEdits(date);

    return data;
  } catch (error) {
    showError("Chyba při načítání editů skladů: " + error.message);
    return [];
  }
}

// Funkce pro vykreslení seznamu editů skladů
function renderWarehouseEdits(edits) {
  const tbody = document.getElementById("editsList");
  if (!edits || edits.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="no-data">Žádné edity pro tento den</td></tr>';
    return;
  }

  tbody.innerHTML = edits
    .map(
      (edit) => `
        <tr>
            <td>${formatDate(edit.edit_date)}</td>
            <td>${edit.warehouse_name}</td>
            <td>${formatMaterialType(edit.material_type)}</td>
            <td>${edit.previous_quantity}</td>
            <td>${edit.new_quantity}</td>
            <td class="${
              edit.new_quantity > edit.previous_quantity
                ? "quantity-high"
                : "quantity-low"
            }">
                ${edit.new_quantity > edit.previous_quantity ? "+" : ""}${
        edit.new_quantity - edit.previous_quantity
      }
            </td>
            <td>${formatDateTime(edit.created_at)}</td>
        </tr>
    `
    )
    .join("");
}

// Funkce pro formátování typu materiálu
function formatMaterialType(type) {
  const materialNames = {
    kanoe: "Kanoe",
    kanoe_rodinna: "Rodinná kanoe",
    velky_raft: "Velký raft",
    padlo: "Pádlo",
    padlo_detske: "Dětské pádlo",
    vesta: "Vesta",
    vesta_detska: "Dětská vesta",
    barel: "Barel",
  };

  return materialNames[type] || type;
}

// Funkce pro formátování data a času
function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return `${date.toLocaleDateString("cs-CZ")} ${date.toLocaleTimeString(
    "cs-CZ"
  )}`;
}

// Upravíme funkci renderInventory pro zobrazení základních stavů, změn a aktuálních stavů
function renderInventory(data) {
  const grid = document.getElementById("inventoryGrid");

  if (!grid) {
    console.error("Inventory grid element not found!");
    return;
  }

  console.log("Rendering inventory data for", data.length, "warehouses");

  grid.innerHTML = data
    .map(
      (warehouse) => `
        <div class="warehouse-card" data-warehouse-id="${warehouse.id}">
            <div class="warehouse-header">
                <div class="warehouse-title-section">
                    <h3 class="warehouse-title">${warehouse.name}</h3>
                    <div class="warehouse-location">${warehouse.location}</div>
                </div>
                <div class="warehouse-button-group">
                    <button onclick="editWarehouse(${
                      warehouse.id
                    }, ${JSON.stringify(warehouse).replace(
        /"/g,
        "&quot;"
      )})" class="btn-edit-inventory">Upravit sklad</button>
                    <!-- Report button will be added dynamically by addReportButtonsToWarehouses() -->
                </div>
            </div>
            <div class="warehouse-sections">
                <div class="inventory-section">
                    <div class="section-title">Stav skladu</div>
                    <div class="inventory-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Materiál</th>
                                    <th>Základ</th>
                                    <th>Změna</th>
                                    <th>Aktuální stav</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderInventoryTableWithState(
                                  warehouse.items
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="daily-plan-section">
                    <div class="section-title">Denní plán</div>
                    <div class="daily-plan">
                        <div class="plan-departures">
                            <h4>Výdej vybavení</h4>
                            ${renderDepartures(
                              warehouse.dailyPlan?.departures || []
                            )}
                        </div>
                        <div class="plan-returns">
                            <h4>Očekávané vrácení</h4>
                            ${renderReturns(warehouse.dailyPlan?.returns || [])}
                        </div>
                        <div class="plan-edits">
                            <h4>Edity skladu</h4>
                            ${renderWarehouseEditsForDay(
                              warehouse.dailyPlan?.edits || []
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join("");

  // Add report buttons AFTER the warehouses have been rendered
  setTimeout(() => {
    addReportButtonsToWarehouses();
  }, 100);
}

// Enhanced renderInventoryTableWithState function to properly display inventory data
function renderInventoryTableWithState(items) {
  const itemTypes = [
    "kanoe",
    "kanoe_rodinna",
    "velky_raft",
    "padlo",
    "padlo_detske",
    "vesta",
    "vesta_detska",
    "barel",
  ];

  return itemTypes
    .map((type) => {
      // Initialize default values to prevent undefined errors
      let baseQuantity = 0;
      let changes = [];
      let changeTotal = 0;
      let currentQuantity = 0;

      if (typeof items[type] === "object" && items[type] !== null) {
        // If we have the new structure with detailed properties
        baseQuantity = items[type].baseQuantity || 0;
        // Ensure changes is an array
        changes = Array.isArray(items[type].changes) ? items[type].changes : [];
        changeTotal = items[type].changeTotal || 0;
        currentQuantity = items[type].currentQuantity || 0;
      } else {
        // If it's a simple number value (old structure)
        currentQuantity = items[type] || 0;
        baseQuantity = currentQuantity;
        // No changes array in the old format
      }

      // Get the appropriate CSS classes for color display
      const baseClass = getQuantityColorClass(baseQuantity);

      // Filter the changes array to show only operational changes (not edits)
      const operationalChanges = Array.isArray(changes)
        ? changes.filter((change) => !change.isEdit)
        : [];

      // Calculate the total from operational changes directly from the changes array
      const operationalChangeTotal = operationalChanges.reduce(
        (sum, change) => sum + change.quantity,
        0
      );

      const changeClass =
        operationalChangeTotal > 0
          ? "quantity-high"
          : operationalChangeTotal < 0
          ? "quantity-low"
          : "";
      const currentClass = getQuantityColorClass(currentQuantity);

      // Debug data (can be removed in production)
      console.log(
        `${type}: Base=${baseQuantity}, Change=${operationalChangeTotal}, Current=${currentQuantity}`
      );

      return `
            <tr>
                <td>${formatMaterialType(type)}</td>
                <td class="quantity-cell ${baseClass}">${baseQuantity}</td>
                <td class="quantity-cell ${changeClass}">
                    ${
                      operationalChangeTotal > 0 ? "+" : ""
                    }${operationalChangeTotal}
                    ${renderChangesDetails(operationalChanges)}
                </td>
                <td class="quantity-cell ${currentClass}">
                    ${currentQuantity}
                </td>
            </tr>
        `;
    })
    .join("");
}

// Improved renderWarehouseEditsForDay function to clearly show edit details
function renderWarehouseEditsForDay(edits) {
  if (!edits || edits.length === 0) {
    return '<div class="no-data">Žádné edity pro tento den</div>';
  }

  return edits
    .map((edit) => {
      const difference = edit.new_quantity - edit.previous_quantity;
      const differenceClass = difference > 0 ? "quantity-high" : "quantity-low";
      const formattedTime = formatTime(
        new Date(edit.created_at).toTimeString().split(" ")[0]
      );

      return `
            <div class="plan-item edit">
                <div class="plan-time-edit">${formattedTime}</div>
                <div class="edit-details">
                    <div class="edit-title">
                        <span class="material-name">${formatMaterialType(
                          edit.material_type
                        )}</span>
                        <span class="edit-action">ruční úprava</span>
                    </div>
                    <div class="edit-info">
                        <div class="quantity-change">
                            <span class="old-quantity">${
                              edit.previous_quantity
                            }</span>
                            <span class="arrow">→</span>
                            <span class="new-quantity">${
                              edit.new_quantity
                            }</span>
                            <span class="difference ${differenceClass}">
                                (${difference > 0 ? "+" : ""}${difference})
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
}

// Přidáme novou funkci pro editaci celého skladu
function editWarehouse(warehouseId, warehouse) {
  const modal = document.getElementById("inventoryModal");
  const form = document.getElementById("inventoryEditForm");

  const itemNames = {
    kanoe: "Kanoe",
    kanoe_rodinna: "Rodinná kanoe",
    velky_raft: "Velký raft",
    padlo: "Pádlo",
    padlo_detske: "Dětské pádlo",
    vesta: "Vesta",
    vesta_detska: "Dětská vesta",
    barel: "Barel",
  };

  // Zpracujeme warehouse jako objekt, pokud byl předán jako string
  if (typeof warehouse === "string") {
    try {
      warehouse = JSON.parse(warehouse);
    } catch (e) {
      console.error("Chyba při parsování dat skladu:", e);
    }
  }

  form.innerHTML = `
        <h3>Upravit množství - ${warehouse.name}</h3>
        <div class="inventory-edit-grid">
            ${Object.entries(warehouse.items)
              .map(([type, quantity]) => {
                // Zjistíme aktuální hodnotu (může být objekt nebo číslo)
                let currentValue = quantity;
                if (typeof quantity === "object" && quantity !== null) {
                  currentValue = quantity.currentQuantity || 0;
                }

                return `
                <div class="inventory-edit-group">
                    <label>${itemNames[type]}:</label>
                    <input type="number" 
                           id="quantity_${type}" 
                           value="${currentValue}" 
                           min="0"
                           data-item-type="${type}"
                           data-original-quantity="${currentValue}">
                </div>
                `;
              })
              .join("")}
        </div>
        <div class="inventory-edit-actions">
            <button onclick="saveWarehouseChanges(${warehouseId})" class="btn-save">Uložit</button>
            <button onclick="closeInventoryModal()" class="btn-cancel">Zrušit</button>
        </div>
    `;

  modal.style.display = "block";
}

// Upravená funkce pro uložení změn celého skladu
async function saveWarehouseChanges(warehouseId) {
  try {
    const updates = [];
    const inputs = document.querySelectorAll(
      '#inventoryEditForm input[type="number"]'
    );
    // Získáme datum z inventoryDate pole nebo použijeme dnešní datum
    const editDate =
      document.getElementById("inventoryDate").value ||
      new Date().toISOString().split("T")[0];

    inputs.forEach((input) => {
      // Přidáváme původní hodnotu, kterou načteme z datasetu
      const originalQuantity = parseInt(input.dataset.originalQuantity) || 0;
      const newQuantity = parseInt(input.value) || 0;

      // Změnu uložíme pouze když se hodnota skutečně změnila
      if (originalQuantity !== newQuantity) {
        updates.push({
          warehouseId,
          itemType: input.dataset.itemType,
          quantity: newQuantity,
          previousQuantity: originalQuantity,
          editDate, // Přidáme datum editu
        });
      }
    });

    // Pokud nemáme žádné změny, ukončíme funkci
    if (updates.length === 0) {
      showToast("Žádné změny nebyly provedeny", "info");
      closeInventoryModal();
      return;
    }

    // Sekvenčně uložíme všechny změny jako edity (bez změny základního množství v inventory_items)
    for (const update of updates) {
      const response = await fetch("/api/inventory/update", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(update),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Chyba při ukládání položky ${update.itemType}`
        );
      }
    }

    showToast("Změny byly úspěšně zaznamenány jako edity", "success");
    closeInventoryModal();
    await loadInventory(); // Znovu načteme data aby ukázaly aktuální stav
  } catch (error) {
    showToast(`Chyba při ukládání: ${error.message}`, "error");
  }
}

// Přidat nové funkce pro správu inventáře
function editInventory(warehouseId, itemType, currentQuantity) {
  const modal = document.getElementById("inventoryModal");
  const form = document.getElementById("inventoryEditForm");

  form.innerHTML = `
        <h3>Upravit množství</h3>
        <div class="inventory-edit-group">
            <label>Aktuální množství: ${currentQuantity}</label>
            <input type="number" id="newQuantity" value="${currentQuantity}" min="0">
        </div>
        <div class="inventory-edit-actions">
            <button onclick="saveInventoryChange(${warehouseId}, '${itemType}')" class="btn-save">Uložit</button>
            <button onclick="closeInventoryModal()" class="btn-cancel">Zrušit</button>
        </div>
    `;

  modal.style.display = "block";
}

function closeInventoryModal() {
  const modal = document.getElementById("inventoryModal");
  modal.style.display = "none";
}

async function saveInventoryChange(warehouseId, itemType) {
  const newQuantity = parseInt(document.getElementById("newQuantity").value);
  const editDate =
    document.getElementById("inventoryDate").value ||
    new Date().toISOString().split("T")[0];

  try {
    // Nejprve získáme současný stav k danému datu
    const response = await fetch(`/api/warehouse/status/${editDate}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Chyba při načítání aktuálního stavu");
    const data = await response.json();

    // Najdeme správný sklad a položku
    const warehouse = data.find((w) => w.id == warehouseId);
    if (!warehouse) throw new Error("Sklad nebyl nalezen");

    // Získáme aktuální hodnotu jako previousQuantity pro edit
    let previousQuantity = 0;
    if (warehouse.items[itemType]) {
      previousQuantity =
        typeof warehouse.items[itemType] === "object"
          ? warehouse.items[itemType].currentQuantity
          : warehouse.items[itemType];
    }

    // Vytvoříme edit (bez změny základního inventáře)
    const updateResponse = await fetch("/api/inventory/update", {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        warehouseId,
        itemType,
        quantity: newQuantity,
        previousQuantity,
        editDate,
      }),
    });

    const result = await updateResponse.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    showToast("Edit byl úspěšně zaznamenán", "success");
    closeInventoryModal();
    await loadInventory(); // Znovu načteme data
  } catch (error) {
    showToast(`Chyba při ukládání: ${error.message}`, "error");
  }
}

// Přidat novou funkci pro určení třídy podle množství
function getQuantityClass(itemType, quantity) {
  // Nastavení limitů pro různé typy vybavení
  const limits = {
    default: { low: 5, medium: 10 },
    padlo: { low: 10, medium: 20 },
    vesta: { low: 10, medium: 20 },
  };

  const { low, medium } = limits[itemType] || limits.default;

  if (quantity <= low) return "quantity-low";
  if (quantity <= medium) return "quantity-medium";
  return "quantity-high";
}

function renderInventoryItem(item, quantity) {
  const quantityClass = getQuantityClass(item, quantity);
  return `
        <div class="inventory-item">
            <span class="item-name">${formatItemName(item)}</span>
            <span class="item-quantity ${quantityClass}">${quantity}</span>
        </div>
    `;
}

// Upravíme načtení stránky
document.addEventListener("DOMContentLoaded", async () => {
  if (!checkAuth()) return;

  try {
    displayUsername(); // Přidáme zobrazení uživatelského jména
    // Změníme cestu pro kontrolu na správný endpoint
    const response = await fetch("/api/orders/list", {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Neplatné přihlášení");
    }

    // Pokud je token platný, načteme data
    await loadOrders();
    await loadUsers();
    await loadInventory();

    // Also load warehouse edits if that tab is currently active
    if (
      document.getElementById("warehouse-edits").classList.contains("active")
    ) {
      await loadAllWarehouseEdits(true);
    }

    setupModalHandlers();

    // Nastavíme dnešní datum pro inventář
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("inventoryDate").value = today;
  } catch (error) {
    console.error("Init failed:", error);
    if (error.message === "Neplatné přihlášení") {
      logout();
    } else {
      UI.showError("Chyba při načítání dat");
    }
  }
});

function setupModalHandlers() {
  const modal = document.getElementById("orderModal");
  const closeBtn = modal.querySelector(".close");

  closeBtn.onclick = () => (modal.style.display = "none");
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

// Přidáme pomocnou funkci pro formátování data do HTML input formátu (YYYY-MM-DD)
function formatDateForInput(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

function createLocationSelector(name, value) {
  const options = Object.entries(LOCATIONS)
    .map(
      ([key, text]) =>
        `<option value="${key}" ${
          value === key ? "selected" : ""
        }>${text}</option>`
    )
    .join("");

  return `<select name="${name}" required>${options}</select>`;
}

async function editOrder(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Chyba při načítání dat");
    const result = await response.json();
    const order = result.data;

    const editHtml = `
            <h2>Editace objednávky #${order.id}</h2>
            <form id="editOrderForm" class="edit-form">
                <div class="edit-grid">
                    <div class="edit-section">
                        <h3>Kontaktní údaje</h3>
                        <div class="form-group">
                            <label>Jméno:</label>
                            <input type="text" name="name" value="${
                              order.name
                            }" required>
                        </div>
                        <div class="form-group">
                            <label>Email:</label>
                            <input type="email" name="email" value="${
                              order.email
                            }" required>
                        </div>
                        <div class="form-group">
                            <label>Telefon:</label>
                            <input type="tel" name="phone" value="${
                              order.phone
                            }" required>
                        </div>
                    </div>
                    
                    <div class="edit-section">
                        <h3>Termín</h3>
                        <div class="form-group">
                            <label>Od:</label>
                            <input type="date" name="arrival_date" value="${formatDateForInput(
                              order.arrival_date
                            )}" required>
                            <input type="time" name="arrival_time" value="${formatTime(
                              order.arrival_time
                            )}" required>
                        </div>
                        <div class="form-group">
                            <label>Do:</label>
                            <input type="date" name="departure_date" value="${formatDateForInput(
                              order.departure_date
                            )}" required>
                            <input type="time" name="departure_time" value="${formatTime(
                              order.departure_time
                            )}" required>
                        </div>
                        <div class="form-group">
                            <label>Místo vyzvednutí:</label>
                            ${createLocationSelector(
                              "pickup_location",
                              order.pickup_location
                            )}
                        </div>
                        <div class="form-group">
                            <label>Místo vrácení:</label>
                            ${createLocationSelector(
                              "return_location",
                              order.return_location
                            )}
                        </div>
                    </div>

                    <div class="edit-section">
                        <h3>Vybavení</h3>
                        <div class="form-group">
                            <label>Kanoe:</label>
                            <input type="number" name="kanoe" value="${
                              order.kanoe
                            }" min="0">
                        </div>
                        <div class="form-group">
                            <label>Rodinné kanoe:</label>
                            <input type="number" name="kanoe_rodinna" value="${
                              order.kanoe_rodinna
                            }" min="0">
                        </div>
                        <div class="form-group">
                            <label>Velký raft:</label>
                            <input type="number" name="velky_raft" value="${
                              order.velky_raft
                            }" min="0">
                        </div>
                        <div class="form-group">
                            <label>Pádla:</label>
                            <input type="number" name="padlo" value="${
                              order.padlo
                            }" min="0">
                        </div>
                        <div class="form-group">
                            <label>Dětská pádla:</label>
                            <input type="number" name="padlo_detske" value="${
                              order.padlo_detske
                            }" min="0">
                        </div>
                        <div class="form-group">
                            <label>Vesty:</label>
                            <input type="number" name="vesta" value="${
                              order.vesta
                            }" min="0">
                        </div>
                        <div class="form-group">
                            <label>Dětské vesty:</label>
                            <input type="number" name="vesta_detska" value="${
                              order.vesta_detska
                            }" min="0">
                        </div>
                        <div class="form-group">
                            <label>Barely:</label>
                            <input type="number" name="barel" value="${
                              order.barel
                            }" min="0">
                        </div>
                    </div>

                    <div class="edit-section">
                        <h3>Doprava</h3>
                        <div class="form-group">
                            <label>Přeprava vybavení:</label>
                            <select name="transport_items">
                                <option value="Ano" ${
                                  order.transport_items === "Ano"
                                    ? "selected"
                                    : ""
                                }>Ano</option>
                                <option value="Ne" ${
                                  order.transport_items === "Ne"
                                    ? "selected"
                                    : ""
                                }>Ne</option>
                                <option value="Nezvoleno" ${
                                  order.transport_items === "Nezvoleno"
                                    ? "selected"
                                    : ""
                                }>Nezvoleno</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Přeprava osob:</label>
                            <select name="transport_people">
                                <option value="Žádná" ${
                                  order.transport_people === "Žádná"
                                    ? "selected"
                                    : ""
                                }>Žádná</option>
                                <option value="Microbus" ${
                                  order.transport_people === "Microbus"
                                    ? "selected"
                                    : ""
                                }>Microbus</option>
                                <option value="Autobus" ${
                                  order.transport_people === "Autobus"
                                    ? "selected"
                                    : ""
                                }>Autobus</option>
                                <option value="Nezvoleno" ${
                                  order.transport_people === "Nezvoleno"
                                    ? "selected"
                                    : ""
                                }>Nezvoleno</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Poznámka:</label>
                            <textarea name="order_note">${
                              order.order_note || ""
                            }</textarea>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-save">Uložit změny</button>
                    <button type="button" onclick="closeEditDialog()" class="btn-cancel">Zrušit</button>
                </div>
            </form>
        `;

    const editDialog = document.createElement("div");
    editDialog.className = "edit-dialog";
    editDialog.innerHTML = editHtml;
    document.body.appendChild(editDialog);

    // Přidáme handler pro formulář
    document
      .getElementById("editOrderForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveOrderChanges(orderId, e.target);
      });
  } catch (error) {
    showError("Chyba při načítání dat objednávky");
    console.error(error);
  }
}

// Oprava funkce saveOrderChanges
async function saveOrderChanges(orderId, form) {
  try {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    showMessage("Změny byly úspěšně uloženy");
    closeEditDialog();
    await loadOrders();
  } catch (error) {
    showError(`Chyba při ukládání změn: ${error.message}`);
  }
}

function closeEditDialog() {
  const dialog = document.querySelector(".edit-dialog");
  if (dialog) {
    dialog.remove();
  }
}

// Globální proměnná pro uložení všech načtených editů
let allWarehouseEdits = [];

// Upravená funkce pro načtení všech editů skladů
async function loadAllWarehouseEdits(loadAll = false) {
  try {
    const fromDate = loadAll
      ? ""
      : document.getElementById("editsFromDate").value || "";
    const toDate = loadAll
      ? ""
      : document.getElementById("editsToDate").value || "";

    let url = "/api/warehouse/edits";
    if (!loadAll && (fromDate || toDate)) {
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Chyba při načítání dat");
    const data = await response.json();

    // Uložíme všechny načtené edity pro pozdější filtrování
    allWarehouseEdits = data;

    // Zobrazíme edity
    filterWarehouseEdits();

    // Pokud načítáme všechny, vymažeme datumy
    if (loadAll) {
      document.getElementById("editsFromDate").value = "";
      document.getElementById("editsToDate").value = "";
    }

    showMessage(`Načteno ${data.length} editů skladů`);
  } catch (error) {
    showError("Chyba při načítání editů skladů: " + error.message);
    console.error(error);
  }
}

// Funkce pro filtrování editů skladů podle vyhledávacího výrazu
function filterWarehouseEdits() {
  const searchTerm = document.getElementById("editsSearch").value.toLowerCase();
  let filteredEdits = [...allWarehouseEdits];

  if (searchTerm) {
    filteredEdits = filteredEdits.filter(
      (edit) =>
        edit.warehouse_name.toLowerCase().includes(searchTerm) ||
        formatMaterialType(edit.material_type)
          .toLowerCase()
          .includes(searchTerm) ||
        edit.edit_date.includes(searchTerm) ||
        edit.previous_quantity.toString().includes(searchTerm) ||
        edit.new_quantity.toString().includes(searchTerm) ||
        edit.id.toString().includes(searchTerm)
    );
  }

  // Aktualizujeme počítadla záznamů
  document.getElementById("displayedEditsCount").textContent =
    filteredEdits.length;
  document.getElementById("totalEditsCount").textContent =
    allWarehouseEdits.length;

  // Vykreslíme filtrovaná data
  renderWarehouseEditsList(filteredEdits);
}

// Upravená funkce pro vykreslení seznamu všech editů skladů
function renderWarehouseEditsList(edits) {
  const tbody = document.getElementById("warehouseEditsList");

  if (!edits || edits.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="no-data">Žádné edity nenalezeny</td></tr>';
    return;
  }

  tbody.innerHTML = edits
    .map((edit) => {
      const difference = edit.new_quantity - edit.previous_quantity;
      const differenceClass =
        difference > 0 ? "quantity-high" : difference < 0 ? "quantity-low" : "";

      return `
            <tr>
                <td>${edit.id}</td>
                <td>${formatDate(edit.edit_date)}</td>
                <td>${edit.warehouse_name}</td>
                <td>${formatMaterialType(edit.material_type)}</td>
                <td>${edit.previous_quantity}</td>
                <td>${edit.new_quantity}</td>
                <td class="${differenceClass}">
                    ${difference > 0 ? "+" : ""}${difference}
                </td>
                <td>${formatDateTime(edit.created_at)}</td>
                <td>
                    <button onclick="deleteWarehouseEdit(${
                      edit.id
                    })" class="btn-action btn-delete" title="Smazat">Smazat</button>
                </td>
            </tr>
        `;
    })
    .join("");
}

// Přidáme novou funkci pro smazání editu skladu
async function deleteWarehouseEdit(editId) {
  if (!confirm("Opravdu chcete smazat tento edit skladu?")) {
    return;
  }

  try {
    const loadingToastId = showLoadingToast(
      "Odstraňování editu skladu...",
      "delete-edit-toast"
    );

    const response = await fetch(`/api/warehouse/edits/${editId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Chyba při odstraňování editu skladu"
      );
    }

    removeToast(loadingToastId);
    showToast("Edit skladu byl úspěšně odstraněn", "success");

    // Znovu načteme seznam editů
    loadAllWarehouseEdits();

    // Pokud jsme v záložce inventáře, aktualizujeme i tam data
    const inventoryTab = document.getElementById("inventory");
    if (inventoryTab && inventoryTab.classList.contains("active")) {
      loadInventory();
    }
  } catch (error) {
    console.error("Chyba při odstraňování editu skladu:", error);
    showError(`Chyba při odstraňování: ${error.message}`);
  }
}

// Upravíme funkci renderInventory pro lepší zobrazení stavu skladů - odstraněna "Akce" v hlavičce
function renderInventory(data) {
  const grid = document.getElementById("inventoryGrid");
  grid.innerHTML = data
    .map(
      (warehouse) => `
        <div class="warehouse-card" data-warehouse-id="${warehouse.id}">
            <div class="warehouse-header">
                <div class="warehouse-title-section">
                    <h3 class="warehouse-title">${warehouse.name}</h3>
                    <div class="warehouse-location">${warehouse.location}</div>
                </div>
                <div class="warehouse-button-group">
                    <button onclick="editWarehouse(${
                      warehouse.id
                    }, ${JSON.stringify(warehouse).replace(
        /"/g,
        "&quot;"
      )})" class="btn-edit-inventory">Upravit sklad</button>
                    <!-- Report button will be added dynamically by addReportButtonsToWarehouses() -->
                </div>
            </div>
            <div class="warehouse-sections">
                <div class="inventory-section">
                    <div class="section-title">Stav skladu</div>
                    <div class="inventory-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Materiál</th>
                                    <th>Základ</th>
                                    <th>Změna</th>
                                    <th>Aktuální stav</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderInventoryTableWithState(
                                  warehouse.items
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="daily-plan-section">
                    <div class="section-title">Denní plán</div>
                    <div class="daily-plan">
                        <div class="plan-departures">
                            <h4>Výdej vybavení</h4>
                            ${renderDepartures(warehouse.dailyPlan?.departures)}
                        </div>
                        <div class="plan-returns">
                            <h4>Očekávané vrácení</h4>
                            ${renderReturns(warehouse.dailyPlan?.returns)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Fix the renderInventoryTableWithState function to properly show changes from the daily plan
function renderInventoryTableWithState(items) {
  const itemTypes = [
    "kanoe",
    "kanoe_rodinna",
    "velky_raft",
    "padlo",
    "padlo_detske",
    "vesta",
    "vesta_detska",
    "barel",
  ];

  return itemTypes
    .map((type) => {
      // Initialize default values to prevent undefined errors
      let baseQuantity = 0;
      let changes = [];
      let changeTotal = 0;
      let currentQuantity = 0;

      if (typeof items[type] === "object" && items[type] !== null) {
        // If we have the new structure with detailed properties
        baseQuantity = items[type].baseQuantity || 0;
        // Ensure changes is an array
        changes = Array.isArray(items[type].changes) ? items[type].changes : [];
        changeTotal = items[type].changeTotal || 0;
        currentQuantity = items[type].currentQuantity || 0;
      } else {
        // If it's a simple number value (old structure)
        currentQuantity = items[type] || 0;
        baseQuantity = currentQuantity;
        // No changes array in the old format
      }

      // Get the appropriate CSS classes for color display
      const baseClass = "";

      // Now safely filter the changes array to show only operational changes (not edits)
      // We ONLY want to display changes that are NOT edits in the "Změna" column
      const operationalChanges = Array.isArray(changes)
        ? changes.filter((change) => !change.isEdit)
        : [];

      // Calculate the total from operational changes directly from the changes array
      // This ensures we're displaying the actual changes from orders in the daily plan
      const operationalChangeTotal = operationalChanges.reduce(
        (sum, change) => sum + change.quantity,
        0
      );

      const changeClass =
        operationalChangeTotal > 0
          ? "quantity-high"
          : operationalChangeTotal < 0
          ? "quantity-low"
          : "";
      const currentClass = getQuantityColorClass(currentQuantity);

      return `
            <tr>
                <td>${formatMaterialType(type)}</td>
                <td class="quantity-cell">${baseQuantity}</td>
                <td class="quantity-cell ${changeClass}">
                    ${
                      operationalChangeTotal > 0 ? "+" : ""
                    }${operationalChangeTotal}
                    ${renderChangesDetails(operationalChanges)}
                </td>
                <td class="quantity-cell ${currentClass}">
                    ${currentQuantity}
                </td>
            </tr>
        `;
    })
    .join("");
}

// Nová funkce pro zobrazení detailů změn
function renderChangesDetails(changes) {
  if (!changes || !Array.isArray(changes) || changes.length === 0) {
    return "";
  }

  const detailsHtml = changes
    .map((change) => {
      const prefix = change.quantity > 0 ? "+" : "";
      return `<div>${
        change.description ? change.description + ": " : ""
      }${prefix}${change.quantity}</div>`;
    })
    .join("");

  return `<div class="change-details">${detailsHtml}</div>`;
}

// Funkce pro určení barevné třídy podle množství
function getQuantityColorClass(quantity) {
  if (quantity <= 0) return "quantity-critical";
  if (quantity <= 5) return "quantity-low";
  if (quantity <= 10) return "quantity-medium";
  return "quantity-high";
}

// Přidáme funkci pro načtení stavu skladů
async function loadInventory() {
  try {
    const date =
      document.getElementById("inventoryDate").value ||
      new Date().toISOString().split("T")[0];
    console.log("Loading inventory for date:", date);

    const response = await fetch(`/api/warehouse/status/${date}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Chyba při načítání dat skladů");
    const data = await response.json();
    console.log("Loaded warehouse data:", data);

    // Ensure we have only one version of renderInventory
    renderInventory(data);

    // Also load warehouse edits for the selected date to ensure they appear in both places
    await loadWarehouseEdits(date);

    // Now update the daily plan edits section for each warehouse
    updateDailyPlanEdits(date);
  } catch (error) {
    showError("Chyba při načítání stavu skladů: " + error.message);
  }
}

// New function to keep warehouse edits in sync between tabs
async function updateDailyPlanEdits(date) {
  try {
    // Get all warehouse edits for the date
    const response = await fetch(`/api/warehouse/edits/${date}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Chyba při načítání editů skladů");
    const allEdits = await response.json();

    // Group edits by warehouse ID
    const editsByWarehouse = {};
    allEdits.forEach((edit) => {
      if (!editsByWarehouse[edit.warehouse_id]) {
        editsByWarehouse[edit.warehouse_id] = [];
      }
      editsByWarehouse[edit.warehouse_id].push(edit);
    });

    // Update each warehouse's edits section
    document.querySelectorAll(".warehouse-card").forEach((card) => {
      const warehouseId = card.getAttribute("data-warehouse-id");
      if (warehouseId) {
        const warehouseEdits = editsByWarehouse[warehouseId] || [];
        const editsSection = card.querySelector(".plan-edits");
        if (editsSection) {
          editsSection.innerHTML = `
                        <h4>Edity skladu</h4>
                        ${renderWarehouseEditsForDay(warehouseEdits)}
                    `;
        }
      }
    });

    console.log("Daily plan edits updated successfully");
  } catch (error) {
    console.error("Error updating daily plan edits:", error);
  }
}

// Enhance renderInventory to include warehouse IDs for easier reference
function renderInventory(data) {
  const grid = document.getElementById("inventoryGrid");
  grid.innerHTML = data
    .map(
      (warehouse) => `
        <div class="warehouse-card" data-warehouse-id="${warehouse.id}">
            <div class="warehouse-header">
                <div class="warehouse-title-section">
                    <h3 class="warehouse-title">${warehouse.name}</h3>
                    <div class="warehouse-location">${warehouse.location}</div>
                </div>
                <div class="warehouse-button-group">
                    <button onclick="editWarehouse(${
                      warehouse.id
                    }, ${JSON.stringify(warehouse).replace(
        /"/g,
        "&quot;"
      )})" class="btn-edit-inventory">Upravit sklad</button>
                    <!-- Report button will be added dynamically by addReportButtonsToWarehouses() -->
                </div>
            </div>
            <div class="warehouse-sections">
                <div class="inventory-section">
                    <div class="section-title">Stav skladu</div>
                    <div class="inventory-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Materiál</th>
                                    <th>Základ</th>
                                    <th>Změna</th>
                                    <th>Aktuální stav</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderInventoryTableWithState(
                                  warehouse.items
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="daily-plan-section">
                    <div class="section-title">Denní plán</div>
                    <div class="daily-plan">
                        <div class="plan-departures">
                            <h4>Výdej vybavení</h4>
                            ${renderDepartures(warehouse.dailyPlan?.departures)}
                        </div>
                        <div class="plan-returns">
                            <h4>Očekávané vrácení</h4>
                            ${renderReturns(warehouse.dailyPlan?.returns)}
                        </div>
                        <div class="plan-edits">
                            <h4>Edity skladu</h4>
                            ${renderWarehouseEditsForDay(
                              warehouse.dailyPlan?.edits || []
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Enhance loadWarehouseEdits to automatically update daily plan edits
async function loadWarehouseEdits(date) {
  try {
    const response = await fetch(`/api/warehouse/edits/${date}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Chyba při načítání editů skladů");
    const data = await response.json();

    renderWarehouseEdits(data);

    // Now also update the daily plan sections with the same edit data
    updateDailyPlanEdits(date);

    return data;
  } catch (error) {
    showError("Chyba při načítání editů skladů: " + error.message);
    return [];
  }
}

// Enhance saveInventoryEditWithDate to refresh both tables
async function saveInventoryEditWithDate(
  warehouseId,
  itemType,
  previousQuantity,
  date
) {
  const newQuantity = parseInt(document.getElementById("newQuantity").value);

  if (newQuantity === previousQuantity) {
    showToast("Hodnota nebyla změněna", "info");
    closeInventoryModal();
    return;
  }

  try {
    const response = await fetch("/api/inventory/update", {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        warehouseId,
        itemType,
        quantity: newQuantity,
        previousQuantity,
        editDate: date,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    showToast(
      `Množství ${formatMaterialType(
        itemType
      )} bylo úspěšně změněno z ${previousQuantity} na ${newQuantity}`,
      "success"
    );
    closeInventoryModal();

    // Refresh both inventory view and warehouse edits
    await loadInventory();
    await loadWarehouseEdits(date);

    // Make sure edits are displayed in daily plan
    await updateDailyPlanEdits(date);
  } catch (error) {
    showToast(`Chyba při ukládání: ${error.message}`, "error");
  }
}

// Add a debug function to show detailed warehouse state
function debugWarehouseState(date, warehouseData) {
  console.log(`Debug - Warehouse state for ${date}:`);
  warehouseData.forEach((warehouse) => {
    console.log(`Warehouse: ${warehouse.name}`);
    Object.keys(warehouse.items).forEach((itemType) => {
      if (typeof warehouse.items[itemType] === "object") {
        const item = warehouse.items[itemType];
        console.log(
          `  ${itemType}: base=${item.baseQuantity}, change=${item.changeTotal}, current=${item.currentQuantity}`
        );
        if (item.changes && item.changes.length > 0) {
          console.log("  Changes:");
          item.changes.forEach((change) => {
            console.log(
              `    - ${change.description}: ${change.quantity} (isEdit: ${change.isEdit})`
            );
          });
        }
      }
    });
  });
}

// Add the missing renderDepartures function
function renderDepartures(departures) {
  if (!departures || departures.length === 0) {
    return '<div class="no-data">Žádné výdeje</div>';
  }

  return departures
    .map(
      (order) => `
        <div class="plan-item departure">
            <div class="plan-time">${formatTime(order.arrival_time)}</div>
            <div class="plan-details">
                <div class="plan-customer">${order.name} (${order.phone})</div>
                <div class="plan-equipment">
                    ${renderEquipmentList(order)}
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Add the missing renderReturns function
function renderReturns(returns) {
  if (!returns || returns.length === 0) {
    return '<div class="no-data">Žádné vrácení</div>';
  }

  return returns
    .map(
      (order) => `
        <div class="plan-item return">
            <div class="plan-time">${formatTime(order.departure_time)}</div>
            <div class="plan-details">
                <div class="plan-customer">${order.name} (${order.phone})</div>
                <div class="plan-equipment">
                    ${renderEquipmentList(order)}
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Add helper function to render equipment lists
function renderEquipmentList(order) {
  const equipment = {
    kanoe: "Kanoe",
    kanoe_rodinna: "Rodinná kanoe",
    velky_raft: "Velký raft",
    padlo: "Pádlo",
    padlo_detske: "Dětské pádlo",
    vesta: "Vesta",
    vesta_detska: "Dětská vesta",
    barel: "Barel",
  };

  return Object.entries(equipment)
    .filter(([key, _]) => order[key] > 0)
    .map(([key, name]) => `${order[key]}× ${name}`)
    .join(", ");
}

// Function to change inventory date by the specified number of days
function changeInventoryDate(days) {
  const datePicker = document.getElementById("inventoryDate");
  const currentDate = datePicker.value
    ? new Date(datePicker.value)
    : new Date();

  // Add the specified number of days
  currentDate.setDate(currentDate.getDate() + days);

  // Format date as YYYY-MM-DD
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;

  // Update the date picker value
  datePicker.value = formattedDate;

  // Load the inventory for the new date
  loadInventory();
}

// Fix the initialization to handle the reference errors
document.addEventListener("DOMContentLoaded", async () => {
  if (!checkAuth()) return;

  try {
    displayUsername();
    const response = await fetch("/api/orders/list", {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Neplatné přihlášení");
    }

    await loadOrders();
    await loadUsers();
    await loadInventory();

    if (
      document.getElementById("warehouse-edits").classList.contains("active")
    ) {
      await loadAllWarehouseEdits(true);
    }

    setupModalHandlers();

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("inventoryDate").value = today;
  } catch (error) {
    console.error("Init failed:", error);
    if (error.message === "Neplatné přihlášení") {
      logout();
    } else {
      showError("Chyba při načítání dat");
    }
  }
});

// If using modules, explicitly expose functions to global scope
// Add this at the end of the file to make functions globally accessible
window.showTab = showTab;
window.logout = logout;
window.filterOrders = filterOrders;
window.loadOrders = loadOrders;
window.sortOrders = sortOrders;
window.viewOrder = viewOrder;
window.editOrder = editOrder;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrder = deleteOrder;
window.loadUsers = loadUsers;
window.confirmDelete = confirmDelete;
window.closeDeleteDialog = closeDeleteDialog;
window.submitStatus = submitStatus;
window.closeStatusDialog = closeStatusDialog;
window.loadInventory = loadInventory;
window.editWarehouse = editWarehouse;
window.saveWarehouseChanges = saveWarehouseChanges;
window.closeInventoryModal = closeInventoryModal;
window.saveOrderChanges = saveOrderChanges;
window.closeEditDialog = closeEditDialog;
window.loadAllWarehouseEdits = loadAllWarehouseEdits;
window.filterWarehouseEdits = filterWarehouseEdits;
window.changeInventoryDate = changeInventoryDate;
window.closeToast = closeToast;
window.deleteWarehouseEdit = deleteWarehouseEdit;

// Ensure toast container exists when the page loads
document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector(".toast-container")) {
    console.error("Toast container missing! Creating one.");
    const container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  // Also expose removeToast to window object
  window.removeToast = removeToast;
});
