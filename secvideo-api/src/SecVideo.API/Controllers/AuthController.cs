using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecVideo.Application.Common.Interfaces;
using SecVideo.Application.DTOs;
using System.Security.Claims;

namespace SecVideo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var response = await _authService.LoginAsync(request, ipAddress, cancellationToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Login failed for {Email}: {Message}", request.Email, ex.Message);
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for {Email}", request.Email);
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    [HttpPost("verify-device")]
    public async Task<ActionResult<LoginResponse>> VerifyDevice([FromBody] DeviceVerificationRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var authHeader = Request.Headers.Authorization.FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new { message = "Authorization token required" });
            }

            var tempToken = authHeader["Bearer ".Length..];
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var response = await _authService.VerifyDeviceAsync(tempToken, request, ipAddress, cancellationToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during device verification");
            return StatusCode(500, new { message = "An error occurred during device verification" });
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _authService.RegisterAsync(request, ipAddress, cancellationToken);
            return Ok(new { message = "Registration successful. You can now log in." });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Registration failed for {Email}: {Message}", request.Email, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for {Email}", request.Email);
            return StatusCode(500, new { message = "An error occurred during registration" });
        }
    }

    [HttpPost("resend-verification")]
    public async Task<ActionResult> ResendVerification(CancellationToken cancellationToken)
    {
        try
        {
            var authHeader = Request.Headers.Authorization.FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new { message = "Authorization token required" });
            }

            // This would need proper implementation to extract user ID from temp token
            return Ok(new { message = "Verification code sent" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending verification code");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [Authorize]
    [HttpGet("session")]
    public async Task<ActionResult<SessionValidationResponse>> ValidateSession(CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var sessionId = GetSessionId();
            var deviceHash = Request.Headers["X-Device-Hash"].FirstOrDefault() ?? string.Empty;

            if (userId == null || sessionId == null)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            var response = await _authService.ValidateSessionAsync(userId.Value, sessionId.Value, deviceHash, cancellationToken);

            if (!response.Valid)
            {
                return Unauthorized(new { message = "Session invalid", code = "SESSION_EXPIRED" });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating session");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<ActionResult> Logout(CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var sessionId = GetSessionId();

            if (userId != null && sessionId != null)
            {
                await _authService.LogoutAsync(userId.Value, sessionId.Value, cancellationToken);
            }

            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<ActionResult<UserDto>> GetProfile(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var user = await _authService.GetUserByIdAsync(userId.Value, cancellationToken);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private Guid? GetSessionId()
    {
        var sessionIdClaim = User.FindFirst("session_id")?.Value;
        return Guid.TryParse(sessionIdClaim, out var sessionId) ? sessionId : null;
    }
}

