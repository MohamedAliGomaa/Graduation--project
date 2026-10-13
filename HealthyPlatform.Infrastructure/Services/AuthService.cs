using HealthyPlatform.Application.Common;
using HealthyPlatform.Application.DTOs.Auth;
using HealthyPlatform.Application.Interfaces;
using HealthyPlatform.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace HealthyPlatform.Infrastructure.Services
{
    public class AuthService : IAuthService
    {

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManger;
        private readonly IConfiguration _configuration;

        public AuthService(UserManager<ApplicationUser> userManager , RoleManager<IdentityRole> roleManger , IConfiguration configuration )
        {
            _userManager = userManager; 
            _roleManger = roleManger;   
            _configuration = configuration; 
        }

        public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto dto)
        {
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                return ApiResponse<AuthResponseDto>.Failure("البريد الإلكتروني مُسجّل بالفعل");
            }


            var user = new ApplicationUser
            {
                FulllName = $"{dto.FirstName.Trim()} {dto.LastName.Trim()}",
                Email = dto.Email,
                UserName = dto.Email,
                PhoneNumber = dto.PhoneNumber
            };

            var result = await _userManager.CreateAsync(user , dto.Password);
            if (!result.Succeeded)
            {
                var error = result.Errors.Select(e => e.Description).ToList();
                return ApiResponse<AuthResponseDto>.Failure(error, "فشل اتشاء الحساب");
            }

            // Assign Default Role "User"
            if (!await _roleManger.RoleExistsAsync("User"))
            {
                await _roleManger.CreateAsync(new IdentityRole("User"));
            }
            await _userManager.AddToRoleAsync(user, "User");

            var token = await GenerateJwtTokenAsync(user);
            var response = new AuthResponseDto
            {
                Token = token ,
                UserId = user.Id ,
                UserName = user.FulllName,
                Email = user.Email,
                Role = "User"
            };

            return ApiResponse<AuthResponseDto>.Success(response, "تم إنشاء الحساب بنجاح");

        }


        public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            {
                return ApiResponse<AuthResponseDto>.Failure("البريد الإلكتروني أو كلمة السر غير صحيحة");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "User";

            var token = await GenerateJwtTokenAsync(user);

            var response = new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                UserName = user.FulllName ,
                Email = user.Email!,
                Role = role
            };

            return ApiResponse<AuthResponseDto>.Success(response, "تم تسجيل الدخول بنجاح");
        }













        private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);

            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.FulllName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddDays(double.Parse(_configuration["JwtSettings:DurationInDays"]!));

            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
