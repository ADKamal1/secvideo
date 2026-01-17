namespace SecVideo.Application.DTOs;

public record LoginRequest(
    string Email,
    string Password,
    string DeviceHash
);

public record LoginResponse(
    UserDto? User,
    string? Token,
    string? DeviceId,
    string? SessionId,
    bool RequiresDeviceVerification,
    string? TempToken
);

public record DeviceVerificationRequest(
    string Code,
    string DeviceHash,
    DeviceInfoDto DeviceInfo
);

public record DeviceInfoDto(
    string VisitorId,
    string? UserAgent,
    string? Platform,
    string? ScreenResolution,
    string? Timezone,
    int? HardwareConcurrency
);

public record UserDto(
    Guid Id,
    string Email,
    string Name,
    string? Avatar,
    string Role,
    bool IsActive,
    DateTime CreatedAt
);

public record RegisterRequest(
    string Email,
    string Password,
    string Name,
    string? Role,
    string DeviceHash
);

public record SessionValidationResponse(
    bool Valid,
    UserDto? User
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);

public record ForgotPasswordRequest(
    string Email
);

public record ResetPasswordRequest(
    string Token,
    string Password
);

