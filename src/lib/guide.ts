export type Cut = {
  id: string;
  name: string;
  product: string;
  area: string;
  tender: number; // 1-5
  fat: number; // 1-5
  bestFor: string[];
  method: string;
  tip: string;
  about: string;
};

export const CUTS: Cut[] = [
  { id: "shoulder", name: "Pork Shoulder", product: "pork-shoulder", area: "Front of the pig", tender: 3, fat: 3, bestFor: ["Roasting", "Stews", "Pulled pork", "Grilling"], method: "Low and slow — 3–4 hrs at 150°C, or simmer until fork-tender.", tip: "Choose bone-in for the deepest flavour, boneless for even slicing.", about: "A hard-working cut with beautiful marbling. It rewards patience with rich, juicy, shreddable meat." },
  { id: "belly", name: "Pork Belly", product: "pork-belly", area: "Underside", tender: 4, fat: 5, bestFor: ["Roasting", "BBQ", "Crispy pork", "Braising"], method: "Dry the skin, salt it, roast at 230°C for 30 min, then 160°C until tender.", tip: "Leave it uncovered in the fridge overnight for the crispiest crackling.", about: "Layers of meat and fat under crackling skin — decadent, versatile and the star of any table." },
  { id: "loin", name: "Pork Loin", product: "pork-loin", area: "Along the back", tender: 5, fat: 1, bestFor: ["Roasting", "Medallions", "Pan-searing"], method: "Roast at 190°C to an internal 63°C, then rest 10 minutes.", tip: "Brine for 2 hours to keep this lean cut succulent.", about: "A tender, lean and elegant cut that cooks quickly and slices beautifully." },
  { id: "ribs", name: "Pork Ribs", product: "pork-ribs", area: "Rib cage", tender: 3, fat: 4, bestFor: ["BBQ", "Grilling", "Smoking", "Oven-baking"], method: "Wrap and bake at 150°C for 2½ hrs, then glaze and finish on the grill.", tip: "Remove the membrane from the back for better texture and flavour.", about: "Meaty, flavourful and made for sticky glazes and weekend cookouts." },
  { id: "chops", name: "Pork Chops", product: "pork-chops", area: "Loin & rib end", tender: 4, fat: 2, bestFor: ["Pan-frying", "Grilling", "Quick dinners"], method: "Sear 3–4 minutes per side on a hot pan, baste with butter and herbs.", tip: "Bring chops to room temperature for 20 minutes before cooking.", about: "Thick-cut, bone-in chops that go from fridge to table in under 20 minutes." },
  { id: "leg", name: "Pork Leg", product: "pork-leg", area: "Hind leg", tender: 3, fat: 2, bestFor: ["Roasting", "Slow cooking", "Family meals"], method: "Roast at 170°C, about 35 minutes per kg, plus a 20-minute rest.", tip: "Score the skin and rub with oil and salt for a golden finish.", about: "A generous, lean joint — the classic family roast." },
  { id: "tenderloin", name: "Pork Tenderloin", product: "pork-tenderloin", area: "Inside the loin", tender: 5, fat: 1, bestFor: ["Quick roasts", "Stuffed pork", "Stir-fry"], method: "Sear all sides, then roast at 200°C for 15–20 minutes.", tip: "Don't overcook — it's lean. Pull at 63°C.", about: "The most tender cut on the pig: fast, lean and refined." },
  { id: "head", name: "Pork Head", product: "pork-head", area: "Head", tender: 3, fat: 4, bestFor: ["Pepper soup", "Brawn", "Stews"], method: "Simmer 2–3 hours with aromatics until the meat falls away.", tip: "Ask for it cleaned and split for easier cooking.", about: "Deeply flavoured and gelatin-rich — essential for traditional soups." },
  { id: "feet", name: "Pork Feet (Trotters)", product: "pork-feet", area: "Lower legs", tender: 2, fat: 3, bestFor: ["Pepper soup", "Stews", "Braising"], method: "Pressure-cook 45 minutes or simmer 3 hours until tender.", tip: "Parboil first and discard the water for a cleaner broth.", about: "Rich in natural collagen, they give soups and stews a silky body." },
  { id: "mince", name: "Minced Pork", product: "minced-pork", area: "Trimmed from shoulder", tender: 4, fat: 3, bestFor: ["Burgers", "Meatballs", "Bolognese", "Stuffing"], method: "Brown in a hot pan in batches so it sears rather than steams.", tip: "Mix in a little fat for juicier burgers and meatballs.", about: "Freshly ground from lean shoulder — flexible, quick and budget-friendly." },
];

export const FAQ = [
  { q: "How fresh is your pork?", a: "All fresh pork is processed, chilled and packed shortly before dispatch and delivered in insulated cold boxes. Frozen products are clearly labelled." },
  { q: "How does weight-based pricing work?", a: "You choose the weight you want (0.5kg, 1kg, 2kg, 5kg, 10kg or custom). The price updates instantly. Larger quantities automatically unlock bulk, wholesale and business pricing." },
  { q: "Will my whole pig weigh exactly what I selected?", a: "Whole pigs are sold by estimated weight range (for example 40–50kg). Our team confirms the final weight and price before fulfilment where necessary, so you're never overcharged." },
  { q: "Can I choose how the pig is prepared?", a: "Yes. Choose Whole, Cleaned, Dressed or Custom Cut when ordering a whole pig, and tell us your cutting instructions." },
  { q: "Which areas do you deliver to?", a: "We deliver across Lagos, Ibadan (Oyo), Ogun, Abuja and nearby states with zone-based fees. Other states are arranged case by case. Delivery availability may vary by location and product type." },
  { q: "What payment methods do you accept?", a: "Paystack, Flutterwave, bank transfer and — for selected locations — pay on delivery." },
  { q: "Do you supply restaurants and hotels?", a: "Absolutely. Tabis Business offers tiered bulk pricing and custom quotes with invoicing. Submit a wholesale quote request and our sales team will respond with a quote." },
  { q: "How do I track my order?", a: "Log in to view your orders or use the Track Order page with your order number and the email or phone number you used at checkout." },
  { q: "What is your refund policy?", a: "If your order arrives damaged or not as described, contact us within 24 hours with photos and we'll replace or refund. See our Refund Policy for details." },
];

export const LEGAL: Record<string, { title: string; body: string }> = {
  privacy: {
    title: "Privacy Policy",
    body: "We collect only the information needed to process your orders and improve our service: your name, contact details, delivery address and order history.\n\n## How we use your data\nTo fulfil and deliver your orders, send order updates, handle support requests and — if you opt in — send offers and recipes.\n\n## Payments\nCard payments are processed by Paystack or Flutterwave. Tabis never stores your card details.\n\n## Your rights\nYou can request access to, correction of or deletion of your personal data at any time by contacting us.",
  },
  terms: {
    title: "Terms & Conditions",
    body: "By placing an order with Tabis Pork Palace you agree to these terms.\n\n## Orders & pricing\nPrices are shown in Nigerian Naira. Weight-based and whole-pig items are priced on estimated weight; final weight and price may be confirmed before fulfilment.\n\n## Availability\nProducts are subject to availability. We may contact you to substitute or cancel items that cannot be fulfilled.\n\n## Wholesale quotes\nQuotes are valid for the period stated on the quote and become orders once accepted and paid.",
  },
  refunds: {
    title: "Refund Policy",
    body: "Fresh meat is perishable, so we handle issues quickly.\n\n## Damaged or incorrect orders\nContact us within 24 hours of delivery with photos. We will replace the item or refund you.\n\n## Weight adjustments\nIf the final weight of a weight-based item differs from your order, we adjust the price accordingly.\n\n## Cancellations\nOrders can be cancelled before preparation begins. Paid cancellations are refunded to the original payment method.",
  },
  "delivery-policy": {
    title: "Delivery Policy",
    body: "Delivery availability may vary by location and product type.\n\n## Zones & fees\nDelivery fees are zone-based and shown at checkout. Some locations require us to confirm the delivery fee after you order.\n\n## Handling\nFresh products are delivered chilled in insulated packaging. Please be available to receive your order.\n\n## Pickup\nPickup from our facility is free. We'll notify you when your order is ready.",
  },
};
