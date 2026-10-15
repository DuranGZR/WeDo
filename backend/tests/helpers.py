import re


def verified_sign_up(client, path, **kwargs):
    """Register and complete email ownership before testing authenticated features."""
    response = client.post(path, **kwargs)
    if response.status_code == 201:
        code = re.search(
            r"kodun: ([0-9]{6})", client.verification_messages[-1]["text"]
        )[1]
        verified = client.post(
            "/api/v1/auth/verify-email",
            json={
                "verification_id": response.json()["verification_id"],
                "code": code,
            },
        )
        assert verified.status_code == 204
    return response
