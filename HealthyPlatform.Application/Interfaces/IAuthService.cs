using HealthyPlatform.Application.Common;
using HealthyPlatform.Application.DTOs.Auth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HealthyPlatform.Application.Interfaces
{
    public interface IAuthService
      {
        Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto dto);
        Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto);    

      }
}
