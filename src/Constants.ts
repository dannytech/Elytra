import { versionSpec } from "./Masking.js";

export class Constants {
    public static ServerName = "Elytra";
    public static ConfigNamespace = "minecraft";
    public static ElytraConfigNamespace = "elytra";
    public static ProtocolVersion = 578;
    public static KeyLength = 1024;
    public static VerificationTokenLength = 8;
    public static MaximumPacketLength = 2 * 1024 * 1024;
    public static KeepAliveInterval = 5000;
    public static SupportedVersions = [versionSpec("578")];
}
