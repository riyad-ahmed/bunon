/**
 * Where the website's products come from
 * ---------------------------------------------------------------------------
 * Products are added in the Business Manager dashboard. Its automatic backup
 * (Backup & Restore → "Choose backup folder…" → "Save automatically after
 * every change") writes business-data-latest.json into a backup folder. The
 * website reads the newest backup it finds in the folders below:
 *   - `npm run dev`          picks up every change while it runs
 *   - `npm run publish:site` copies the latest products and puts them online
 *   - `npm run sync` / `npm run build` refresh the saved product list
 *
 * Only public product details are copied: name, category, colour, size,
 * description, selling price, photo and in-stock yes/no. Costs, profit,
 * notes, stock counts, orders, customers and capital never are.
 */
export default {
  /** The dashboard's backup folders (or backup .json files) — the newest backup wins. */
  source: ['G:/BUNON/backup', 'G:/BUNON/accounting-management/data'],

  /** Which business's products to show. */
  business: 'bunon',
}
