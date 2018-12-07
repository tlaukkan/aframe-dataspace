import {AccessController} from "./AccessController";
import {SceneController} from "./SceneController";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {Repository} from "./Repository";
import {PrivilegeType} from "./model/PrivilegeType";
import {User} from "./model/User";
import {Group} from "./model/Group";
import {Principal} from "../framework/rest/Principal";
import {info} from "../util/log";

export class Storage {

    private readonly sceneFileName: string;
    private readonly accessFileName: string;

    accessController: AccessController;
    sceneController: SceneController;
    repository: Repository;

    constructor(sceneFileName: string, accessFileName: string, repository: Repository, sanitizer: Sanitizer) {
        this.sceneFileName = sceneFileName;
        this.accessFileName = accessFileName;
        this.repository = repository;
        this.accessController = new AccessController();
        this.sceneController = new SceneController(sanitizer);
    }

    async startup() {
        await this.load();
    }

    clear() {
        this.sceneController.clear();
        this.accessController.clear();
    }

    init() {
        this.accessController.init();
    }

    async load() {
        const sceneContent = await this.repository.load(this.sceneFileName);
        //console.log("LOADING entities.xml: " + this.sceneFileName + " " + sceneContent);
        if (sceneContent.length > 0) {
            this.sceneController.deserialize(sceneContent);
        } else {
            // Lets save empty file.
            //console.log("INITIALIZING entities.xml");
            await this.repository.save(this.sceneFileName, this.sceneController.serialize());
        }
        const accessContent = await this.repository.load(this.accessFileName);
        if (accessContent.length > 0) {
            this.accessController.deserialize(accessContent);
        } else {
            this.accessController.init();
            await this.save();
        }
    }

    async shutdown() {
        await this.save();
    }

    async save() {
        await this.saveAccess();
        await this.saveScene();
    }

    async saveScene() {
        await this.repository.save(this.sceneFileName, await this.sceneController.serialize());
    }

    async saveAccess() {
        await this.repository.save(this.accessFileName, await this.accessController.serialize());
    }

    // Scene

    async getScene(context: Principal): Promise<string> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.VIEW);
        return this.sceneController.getScene();
    }

    async saveSceneFragment(context: Principal, sceneFragment: string): Promise<string> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.MODIFY);
        const savedSceneFragment = this.sceneController.saveSceneFragment(sceneFragment);
        info(context, "saved scene fragment: " + sceneFragment);
        await this.saveScene();
        return savedSceneFragment;
    }

    async removeSceneFragment(context: Principal, sceneFragment: string): Promise<void> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.MODIFY);
        this.sceneController.removeSceneFragment(sceneFragment);
        info(context, "removed scene fragment: " + sceneFragment);
        await this.saveScene();
    }

    // Users

    async getUsers(context: Principal) : Promise<Array<User>> {
        return Array.from(this.accessController.model.users.values());
    }

    async getUser(context: Principal, id: string): Promise<User | undefined> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        if (this.accessController.hasUser(id)) {
            return this.accessController.getUser(id);
        } else {
            return undefined;
        }
    }

    async addUser(context: Principal, id: string, userName: string): Promise<User> {
        if (this.accessController.getGroup("administrators").userIds.size > 0) {
            // Omit admin check if no admins exist in admin group.
            this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        }

        this.accessController.addUser(id, userName);
        info(context, "user " + id + " added with name : '" + userName + "'");
        // Add user as viewer if viewers group exists.
        if (this.accessController.hasGroup("viewers")) {
            this.accessController.addGroupMember("viewers", id);
            info(context, "user " + id + " added to viewers group.");
        }

        // Add user as administrator if no administrators exist in administrator group.
        if (this.accessController.hasGroup("administrators")) {
            if (this.accessController.getGroup("administrators").userIds.size == 0) {
                this.accessController.addGroupMember("administrators", id);
                info(context, "user " + id + " added as first administrator to administrators group.");
            }
        }

        await this.saveAccess();
        return this.accessController.getUser(id);
    }

    async updateUser(context: Principal, id: string, userName: string): Promise<User> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.updateUser(id, userName);
        info(context, "user " + id + " updated with name : '" + userName + "'");
        await this.saveAccess();
        return this.accessController.getUser(id);
    }

    async removeUser(context: Principal, userId: string): Promise<void> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeUser(userId);
        info(context, "user " + userId + " removed.");
        await this.saveAccess();
    }

    // Groups

    async getGroups(context: Principal): Promise<Array<Group>> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return Array.from(this.accessController.model.groups.values());
    }

    async getGroup(context: Principal, name: string): Promise<Group | undefined> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        if (this.accessController.hasGroup(name)) {
            return this.accessController.getGroup(name);
        } else {
            return undefined;
        }
    }

    async addGroup(context: Principal, groupName: string): Promise<Group> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.addGroup(groupName);
        info(context, "group '" + groupName + "' added.");
        await this.saveAccess();
        return this.accessController.getGroup(groupName);
    }

    async removeGroup(context: Principal, groupName: string): Promise<void> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroup(groupName);
        info(context, "group '" + groupName + "' removed.");
        await this.saveAccess();
    }

    // Group members

    async addGroupMember(context: Principal, groupName: string, userId: string): Promise<void> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.addGroupMember(groupName, userId);
        info(context, "user " + userId + " added to " + groupName + " group.");
        await this.saveAccess();
    }

    async removeGroupMember(context: Principal, groupName: string, userId: string): Promise<void> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroupMember(groupName, userId);
        info(context, "user " + userId + " removed from " + groupName + " group.");
        await this.saveAccess();
    }

    // Privileges

    async getGroupPrivileges(context: Principal, groupName: string): Promise<Array<[string, PrivilegeType]>> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getGroupPrivileges(groupName);
    }

    async getUserPrivileges(context: Principal, userId: string): Promise<Array<[string, PrivilegeType]>> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getUserPrivileges(userId);
    }

    async setGroupPrivilege(context: Principal, groupName: string, type: PrivilegeType, sid: string): Promise<void> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.setGroupPrivilege(groupName, type, sid);
        info(context, "group '" + groupName + "' privilege for '" + sid + "' set to  : '" + type);
        await this.saveAccess();
    }

    async setUserPrivilege(context: Principal, userId: string, type: PrivilegeType, sid: string): Promise<void> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.setUserPrivilege(userId, type, sid);
        info(context, "user '" + userId + "' privilege for '" + sid + "' set to  : '" + type);
        await this.saveAccess();
    }

    async removeGroupPrivilege(context: Principal, groupName: string, sid: string): Promise<void> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroupPrivilege(groupName, sid);
        info(context, "group '" + groupName + "' privilege for '" + sid + "' removed.");
        await this.saveAccess();
    }

    async removeUserPrivilege(context: Principal, userId: string, sid: string): Promise<void> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeUserPrivilege(userId, sid);
        info(context, "user '" + userId + "' privilege for '" + sid + "' removed.");
        await this.saveAccess();
    }

}