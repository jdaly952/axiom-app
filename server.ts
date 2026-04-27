import express from "express";
import path from "path";
import Stripe from "stripe";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Stripe Checkout Route
  app.post("/api/checkout", async (req, res) => {
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      
      if (!stripeKey || stripeKey === "MY_STRIPE_SECRET_KEY") {
        return res.status(500).json({ error: "Stripe not configured. Please add STRIPE_SECRET_KEY to your secrets." });
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });
      const { concept } = req.body;

      if (!concept) {
        return res.status(400).json({ error: "Concept is required for checkout." });
      }

      const domain = process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL" 
        ? process.env.APP_URL 
        : `http://localhost:${PORT}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Understandable Vector Engraving: ${concept.toUpperCase()}`,
                description: "Digital generation & secure distribution of precise SVG cut path logic calculated by the Understandable Engine for a Glowforge.",
              },
              unit_amount: 4900,
            },
            quantity: 1,
          },
        ],
        success_url: `${domain}?success=true`,
        cancel_url: `${domain}?canceled=true`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API routes
  // (Generation moved to frontend)

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
