import * as vscode from "vscode";
import * as fs from "fs";

const isFileOrFolder = (path: string) => {
  try {
    if (fs.lstatSync(path).isDirectory()) {
      return "folder";
    }
    if (fs.lstatSync(path).isFile()) {
      return "file";
    }
  } catch (e) {
    return false;
  }
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("open-folder.open", async () => {
      const showFiles = vscode.workspace
        .getConfiguration()
        .get<boolean>("open-folder.filesEnabled");

      const quickPick = vscode.window.createQuickPick();

      const workspacePath = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.path
        : require("os").homedir();

      quickPick.title = "Open File/Folder";
      quickPick.placeholder = "Enter Path to File/Folder";
      quickPick.value = workspacePath + "/";

      quickPick.onDidChangeValue((value) => {
        const dir = value.split("/").slice(0, -1).join("/");
        const search = value.split("/")[value.split("/").length - 1];

        const files = fs
          .readdirSync(value)
          .filter((file) => file.startsWith(search))
          .filter((file) => {
            if (!showFiles) {
              return isFileOrFolder(dir + "/" + file) === "folder";
            } else {
              return true;
            }
          });

        quickPick.items = files.map((file) => ({
          label: dir + "/" + file,
          buttons: [
            isFileOrFolder(dir + "/" + file) === "file"
              ? {
                  iconPath: new vscode.ThemeIcon("go-to-file"),
                  tooltip: "Open file",
                }
              : {
                  iconPath: new vscode.ThemeIcon("folder"),
                  tooltip: "Open folder",
                },
          ],
        }));
      });

      quickPick.onDidChangeSelection((selection) => {
        if (selection[0].buttons![0].tooltip === "Open file") {
          vscode.workspace
            .openTextDocument(vscode.Uri.parse("file://" + selection[0].label))
            .then((doc) => {
              vscode.window.showTextDocument(doc);
            });
        } else {
          if (!showFiles) {
            vscode.commands.executeCommand(
              "vscode.openFolder",
              vscode.Uri.parse("file://" + selection[0].label)
            );
          } else {
            quickPick.value = selection[0].label + "/";
          }
        }
      });

      quickPick.onDidTriggerItemButton((e) => {
        e.button.tooltip === "Open file"
          ? vscode.workspace
              .openTextDocument(vscode.Uri.parse("file://" + e.item.label))
              .then((doc) => {
                vscode.window.showTextDocument(doc);
              })
          : vscode.commands.executeCommand(
              "vscode.openFolder",
              vscode.Uri.parse("file://" + e.item.label)
            );
      });

      quickPick.show();
    })
  );
}

export function deactivate() {}
