import { Command } from "commander";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import chalk from "chalk";
import { RedmineClient } from "../lib/redmine-client.js";
import { saveConfig } from "../lib/config.js";
import { saveCache } from "../lib/cache.js";
import { createDefaultAliases, saveAliases } from "../lib/alias-resolver.js";
import type { RedmineCustomField } from "../types.js";

export function findDeptCustomField(
  fields: RedmineCustomField[],
): { id: number; name: string; values: string[] } | null {
  const field = fields.find(
    (f) => f.customized_type === "time_entry" && f.name.includes("歸屬部門"),
  );
  if (!field) return null;
  return {
    id: field.id,
    name: field.name,
    values: field.possible_values?.map((v) => v.value) ?? [],
  };
}

export const initCommand = new Command("init")
  .description("Initialize Redmine connection and cache")
  .action(async () => {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      const url = (await rl.question(chalk.cyan("Redmine URL: ")))
        .trim()
        .replace(/\/+$/, "");
      const apiKey = (await rl.question(chalk.cyan("API Key: "))).trim();

      console.log(chalk.yellow("\nConnecting to Redmine..."));
      const client = new RedmineClient(url, apiKey);

      const projects = await client.listProjects();
      console.log(chalk.green(`  Found ${projects.length} projects`));

      const activities = await client.listActivities();
      console.log(chalk.green(`  Found ${activities.length} activities`));

      let deptCustomFieldId: number | undefined;
      let deptValues: string[] | undefined;

      const customFields = await client.listCustomFields();
      if (customFields) {
        const dept = findDeptCustomField(customFields);
        if (dept) {
          deptCustomFieldId = dept.id;
          deptValues = dept.values;
          console.log(
            chalk.green(
              `  Found custom field: ${dept.name} (id=${dept.id}, ${dept.values.length} values)`,
            ),
          );
        }
      } else {
        console.log(
          chalk.yellow("  Cannot access custom fields (admin required)."),
        );
        const cfIdStr = await rl.question(
          chalk.cyan("  Enter 歸屬部門 custom field ID (or skip): "),
        );
        if (cfIdStr.trim()) {
          deptCustomFieldId = Number(cfIdStr.trim());
          const valuesStr = await rl.question(
            chalk.cyan("  Enter dept values (comma separated): "),
          );
          if (valuesStr.trim()) {
            deptValues = valuesStr.split(",").map((v) => v.trim());
          }
        }
      }

      saveConfig({ url, apiKey, deptCustomFieldId });
      saveCache({ projects, activities, deptValues });
      saveAliases(createDefaultAliases());

      console.log(chalk.green("\nInitialization complete!"));
      console.log(chalk.dim("  Config saved to ~/.config/redmine-log/"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`\n錯誤：${msg}`));
      if (msg.includes("無法連線")) {
        console.error(chalk.yellow("請確認："));
        console.error(chalk.yellow("  1. Redmine URL 是否正確"));
        console.error(chalk.yellow("  2. 網路連線是否正常（VPN？）"));
        console.error(chalk.yellow("  3. Redmine 伺服器是否運作中"));
      }
      process.exitCode = 1;
    } finally {
      rl.close();
    }
  });
